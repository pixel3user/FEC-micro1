import type {
  ComposeResponse,
  ExperienceResponse,
  ProviderWorld,
} from "@agent-web/contracts";
import { useState, type FormEvent } from "react";
import { api } from "./api";
import { GeneratedExperienceFrame } from "./GeneratedExperience";

type View = "discover" | "publish" | "about";

export function App() {
  const [view, setView] = useState<View>("discover");

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => setView("discover")}>
          <span className="brand-mark">A/</span>
          <span>Agent Native Web</span>
        </button>
        <nav aria-label="Primary navigation">
          <button
            className={view === "discover" ? "active" : ""}
            onClick={() => setView("discover")}
          >
            Discover
          </button>
          <button
            className={view === "publish" ? "active" : ""}
            onClick={() => setView("publish")}
          >
            Publish
          </button>
          <button
            className={view === "about" ? "active" : ""}
            onClick={() => setView("about")}
          >
            How it works
          </button>
        </nav>
      </header>

      <main>
        {view === "discover" && <Discovery />}
        {view === "publish" && <ProviderStudio />}
        {view === "about" && <About />}
      </main>

      <footer>
        <span>Interfaces are generated at request time.</span>
        <span>No fixed action vocabulary.</span>
      </footer>
    </div>
  );
}

function Discovery() {
  const [intent, setIntent] = useState("");
  const [compose, setCompose] = useState(false);
  const [result, setResult] = useState<
    ExperienceResponse | ComposeResponse | null
  >(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (intent.trim().length < 2) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        compose
          ? await api.compose({ intent: intent.trim(), maxProviders: 4 })
          : await api.createExperience({ intent: intent.trim() }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const plan = result && "plan" in result ? result.plan : null;

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Intent, not pages</span>
          <h1>
            Ask for the outcome.
            <br />
            The interface arrives.
          </h1>
          <p>
            Discover provider agents across a shared public index. A model
            writes a new application for your exact request, then invents
            whatever actions the interaction needs.
          </p>
        </div>
        <form className="intent-box" onSubmit={submit}>
          <label htmlFor="intent">What are you trying to accomplish?</label>
          <textarea
            id="intent"
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            placeholder="Plan a small event next weekend, compare the options, and let me change the tradeoffs…"
            rows={5}
          />
          <label className="compose-toggle">
            <input
              type="checkbox"
              checked={compose}
              onChange={(event) => setCompose(event.target.checked)}
            />
            <span>Compose across multiple providers</span>
          </label>
          <div className="form-row">
            <span>Fresh code · live provider reasoning</span>
            <button
              className="primary"
              disabled={busy || intent.trim().length < 2}
            >
              {busy
                ? compose
                  ? "Composing…"
                  : "Generating…"
                : compose
                  ? "Compose experience"
                  : "Generate experience"}
            </button>
          </div>
        </form>
      </section>

      {error && <ErrorBanner message={error} />}
      {result && (
        <section className="result-section">
          <div className="provider-strip">
            <span className="eyebrow">
              {plan ? "Composed providers" : "Discovered providers"}
            </span>
            <div className="provider-pills">
              {result.providers.map((provider) => (
                <span key={provider.id}>{provider.name}</span>
              ))}
            </div>
          </div>
          {plan && (
            <div className="plan-panel">
              <span className="eyebrow">Composition plan</span>
              <p>{plan.summary}</p>
              <ol className="plan-steps">
                {plan.steps.map((step, index) => (
                  <li key={`${step.worldId}-${index}`}>
                    <strong>{step.worldName}</strong>
                    <span>{step.role}</span>
                    <code>{step.suggestedAction}</code>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <GeneratedExperienceFrame experience={result.experience} />
        </section>
      )}
    </>
  );
}

function ProviderStudio() {
  const [description, setDescription] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [domain, setDomain] = useState("");
  const [world, setWorld] = useState<ProviderWorld | null>(null);
  const [ownerToken, setOwnerToken] = useState("");
  const [revision, setRevision] = useState("");
  const [manifestUrl, setManifestUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api.createWorld({
        message: description,
        ...(preferredName.trim()
          ? { preferredName: preferredName.trim() }
          : {}),
        ...(domain.trim() ? { domain: domain.trim() } : {}),
      });
      setWorld(result.world);
      setOwnerToken(result.ownerToken);
      localStorage.setItem(
        `agent-world-owner:${result.world.id}`,
        result.ownerToken,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const update = async (event: FormEvent) => {
    event.preventDefault();
    if (!world || !revision.trim()) return;
    setBusy(true);
    setError("");
    try {
      setWorld(await api.converse(world.id, ownerToken, revision));
      setRevision("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!world) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.publish(world.id, ownerToken);
      setWorld(result.world);
      setManifestUrl(result.manifestUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="studio-page">
      <div className="page-heading">
        <span className="eyebrow">Provider studio</span>
        <h1>
          Describe a world.
          <br />
          Skip the software stack.
        </h1>
        <p>
          No catalog schema or action checklist. Explain what you provide and
          how you think it should work.
        </p>
      </div>

      {!world ? (
        <form className="studio-card" onSubmit={create}>
          <label htmlFor="provider-name">
            Provider name <small>optional</small>
          </label>
          <input
            id="provider-name"
            value={preferredName}
            onChange={(event) => setPreferredName(event.target.value)}
            placeholder="Northstar Events"
          />
          <label htmlFor="provider-domain">
            Domain <small>optional</small>
          </label>
          <input
            id="provider-domain"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="example.com"
          />
          <label htmlFor="provider-description">
            Tell the agent what exists in your world
          </label>
          <textarea
            id="provider-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={10}
            placeholder="I help groups organize local events. I know these venues and people, I prefer…"
          />
          <button
            className="primary wide"
            disabled={busy || description.trim().length < 10}
          >
            {busy ? "Constructing world…" : "Create provider agent"}
          </button>
        </form>
      ) : (
        <div className="world-grid">
          <article className="world-card">
            <div className="world-title">
              <div>
                <span className="eyebrow">
                  Agent world · revision {world.revision}
                </span>
                <h2>{world.name}</h2>
              </div>
              <span className={world.published ? "published badge" : "badge"}>
                {world.published ? "Published" : "Draft"}
              </span>
            </div>
            <p>{world.summary}</p>
            <dl>
              <div>
                <dt>Network name</dt>
                <dd>{world.slug}.agent</dd>
              </div>
              <div>
                <dt>Persistent state</dt>
                <dd>{Object.keys(world.state).length} top-level records</dd>
              </div>
            </dl>
            <details>
              <summary>World knowledge</summary>
              <pre>{JSON.stringify(world.knowledge, null, 2)}</pre>
            </details>
            {manifestUrl && (
              <p className="manifest-link">
                Manifest: <a href={manifestUrl}>{manifestUrl}</a>
              </p>
            )}
            {!world.published && (
              <button
                className="primary wide"
                disabled={busy}
                onClick={publish}
              >
                Publish to the public index
              </button>
            )}
          </article>
          <form className="studio-card revision-card" onSubmit={update}>
            <span className="eyebrow">Continue the conversation</span>
            <h3>Correct or expand the world</h3>
            <textarea
              value={revision}
              onChange={(event) => setRevision(event.target.value)}
              rows={8}
              placeholder="We also work remotely, and when someone asks for something unusual…"
            />
            <button disabled={busy || !revision.trim()}>
              Apply through agent reasoning
            </button>
          </form>
        </div>
      )}
      {error && <ErrorBanner message={error} />}
    </section>
  );
}

function About() {
  return (
    <section className="about-page">
      <span className="eyebrow">The thin fixed layer</span>
      <h1>
        The network remembers.
        <br />
        The agents decide.
      </h1>
      <div className="principles">
        <article>
          <strong>01</strong>
          <h2>Publish meaning</h2>
          <p>
            Providers explain themselves conversationally. The platform stores
            an open world, not a vertical database schema.
          </p>
        </article>
        <article>
          <strong>02</strong>
          <h2>Resolve intent</h2>
          <p>
            A shared index connects people to provider agents. Well-known
            manifests make each world addressable from other clients.
          </p>
        </article>
        <article>
          <strong>03</strong>
          <h2>Generate the interface</h2>
          <p>
            The model writes a standalone application for each request. Only a
            sandbox and generic transport are supplied.
          </p>
        </article>
        <article>
          <strong>04</strong>
          <h2>Invent the action</h2>
          <p>
            The interface names the operation it needs. The provider model
            interprets it and its recorded decision becomes state.
          </p>
        </article>
      </div>
    </section>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="error-banner" role="alert">
      <strong>Could not continue</strong>
      <span>{message}</span>
    </div>
  );
}
