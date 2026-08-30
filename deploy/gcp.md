# Deploy to GCP + Firebase (chat.thecatgpt.com)

This deploys the prototype as its own service and serves it from
`chat.thecatgpt.com`:

- **API** (`apps/api`) -> **Cloud Run** (public HTTPS, container)
- **Postgres** -> **Cloud SQL** (managed)
- **Web** (`apps/web`) -> **Firebase Hosting**, custom domain `chat.thecatgpt.com`
- **Secrets** -> **Secret Manager** (OpenRouter key + DB password)

Run every block in **GCP Cloud Shell** (already authenticated to your project).
Type secret values only into Cloud Shell — never paste them into chat or commit
them. Paste the resulting **URLs** back to the assistant so CORS / `VITE_API_URL`
can be finalized.

> The API image was built and run locally before shipping this runbook: it
> compiles, boots, binds to `0.0.0.0:$PORT` (Cloud Run requirement), and passes
> its test suite. So the container itself is known-good; the steps below are the
> account-side wiring.
>
> **Pick a DB password without `@ : / ? # &`** — those need percent-encoding in
> `DATABASE_URL`. An alphanumeric password avoids that entirely.

> Security note: the OpenRouter key used here was exposed earlier in chat.
> Rotating it is strongly recommended; these steps store whatever key you set.

---

## 0. Variables

```bash
export PROJECT_ID=catgptblackwell
export REGION=us-central1
export REPO=agent-web
export DB_INSTANCE=agent-web-db
export DB_NAME=agentweb
export DB_USER=agentweb
export SERVICE=agent-web-api

gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"
```

## 1. Enable APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

## 2. Artifact Registry (for the container image)

```bash
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Agent-native web images"
```

## 3. Cloud SQL Postgres

```bash
# Create the instance (smallest tier; you have credits).
gcloud sql instances create "$DB_INSTANCE" \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region="$REGION"

# Database + user. You will be prompted for a password on the next line —
# type it directly into Cloud Shell.
gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE"
read -s -p "New DB password: " DB_PASSWORD; echo
gcloud sql users create "$DB_USER" \
  --instance="$DB_INSTANCE" \
  --password="$DB_PASSWORD"

# Capture the instance connection name (PROJECT:REGION:INSTANCE).
export INSTANCE_CONN=$(gcloud sql instances describe "$DB_INSTANCE" \
  --format='value(connectionName)')
echo "INSTANCE_CONN=$INSTANCE_CONN"
```

## 4. Secrets

```bash
# OpenRouter key — paste the key at the prompt (input hidden).
read -s -p "OpenRouter API key: " OPENROUTER_KEY; echo
printf '%s' "$OPENROUTER_KEY" | gcloud secrets create openrouter-api-key --data-file=-

# DB password into Secret Manager too (used to build DATABASE_URL).
printf '%s' "$DB_PASSWORD" | gcloud secrets create db-password --data-file=-
```

## 5. Build the API image (Cloud Build)

Run from the **repo root** (where `deploy/api.Dockerfile` lives):

```bash
export IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/api:latest"
gcloud builds submit --tag "$IMAGE" --file deploy/api.Dockerfile .
```

## 6. Deploy the API to Cloud Run

Cloud Run connects to Cloud SQL over the built-in socket. The app reads
`DATABASE_URL`; we point it at the unix socket path.

```bash
# URL-encode nothing special assumed; if your password has @ : / it must be
# percent-encoded in DATABASE_URL. Simplest: use a password without those chars.
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME?host=/cloudsql/$INSTANCE_CONN"

gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$INSTANCE_CONN" \
  --set-secrets "OPENROUTER_API_KEY=openrouter-api-key:latest" \
  --set-env-vars "MODEL_MODE=live,SEMANTIC_SEARCH=on,DATABASE_URL=$DATABASE_URL,WEB_ORIGIN=https://chat.thecatgpt.com" \
  --min-instances 0 \
  --max-instances 3 \
  --cpu 1 --memory 512Mi

# Grab the public URL:
export API_URL=$(gcloud run services describe "$SERVICE" --region "$REGION" \
  --format='value(status.url)')
echo "API_URL=$API_URL"
```

Then set `PUBLIC_API_URL` to the real URL and redeploy that one var:

```bash
gcloud run services update "$SERVICE" --region "$REGION" \
  --update-env-vars "PUBLIC_API_URL=$API_URL"
```

Smoke test the API:

```bash
curl -s "$API_URL/health"    # expect {"status":"ok",...,"persistence":"postgresql"}
```

**Paste `API_URL` back to the assistant.** It is needed to build the web app.

## 7. Build the web app against the API

From the repo root, build `apps/web` with the API URL baked in:

```bash
export VITE_API_URL="$API_URL"
pnpm install --frozen-lockfile
pnpm --filter @agent-web/contracts build
VITE_API_URL="$API_URL" pnpm --filter @agent-web/web build
```

## 8. Deploy the web app to Firebase Hosting

```bash
npm i -g firebase-tools
firebase login --no-localhost      # follow the printed URL if in Cloud Shell
cd apps/web
firebase deploy --only hosting --project catgptblackwell
cd ../..
```

This prints a `*.web.app` URL. Verify it loads, then wire the custom domain.

## 9. Custom domain: chat.thecatgpt.com (Firebase + Cloudflare)

1. In the **Firebase console** -> Hosting -> **Add custom domain** ->
   `chat.thecatgpt.com`. Firebase shows a **TXT** record (verification) and
   then **A / AAAA** records (or a CNAME) to add.
2. In **Cloudflare** DNS for `thecatgpt.com`:
   - Add the **TXT** verification record Firebase gives you.
   - Replace the existing dead `chat` record with the **A/AAAA** records (or
     CNAME) Firebase provides.
   - Set the `chat` records to **DNS only** (grey cloud) during verification;
     you can re-enable the proxy afterward if desired.
3. Wait for Firebase to show the domain as **Connected** and the cert issued.

## 10. Finalize CORS

`WEB_ORIGIN` was already set to `https://chat.thecatgpt.com` in step 6. If you
also want the `*.web.app` URL to work, allow both (comma-separated):

```bash
gcloud run services update "$SERVICE" --region "$REGION" \
  --update-env-vars "WEB_ORIGIN=https://chat.thecatgpt.com,https://<your-app>.web.app"
```

## 11. Verify end to end

Open `https://chat.thecatgpt.com`:

1. Create a provider by chat -> publish.
2. Search an intent -> a generated interface appears.
3. Invoke an invented action -> a decision is recorded.

If discovery or generation fails, check `curl "$API_URL/health"` and Cloud Run
logs: `gcloud run services logs read "$SERVICE" --region "$REGION" --limit 50`.

---

## Cost / cleanup

- Cloud SQL `db-f1-micro` has a small always-on cost; Cloud Run scales to zero.
- Model spend is a fraction of a cent per interaction (see `docs/evaluation.md`).
- To tear everything down:

```bash
gcloud run services delete "$SERVICE" --region "$REGION"
gcloud sql instances delete "$DB_INSTANCE"
gcloud artifacts repositories delete "$REPO" --location "$REGION"
gcloud secrets delete openrouter-api-key
gcloud secrets delete db-password
```
