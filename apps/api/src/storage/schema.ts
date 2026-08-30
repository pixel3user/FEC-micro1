export const schemaSql = `
CREATE TABLE IF NOT EXISTS worlds (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  summary text NOT NULL,
  domain text UNIQUE,
  knowledge jsonb NOT NULL DEFAULT '{}'::jsonb,
  instructions text NOT NULL,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  searchable_text text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  owner_token_hash text NOT NULL,
  revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS worlds_search_idx
  ON worlds USING gin (to_tsvector('simple', searchable_text));
CREATE INDEX IF NOT EXISTS worlds_published_updated_idx
  ON worlds (published, updated_at DESC);

CREATE TABLE IF NOT EXISTS world_events (
  id uuid PRIMARY KEY,
  world_id uuid NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  session_id uuid,
  event_type text NOT NULL,
  actor text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS world_events_world_created_idx
  ON world_events (world_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  intent text NOT NULL,
  world_ids jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generated_experiences (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  html text NOT NULL,
  rationale text NOT NULL,
  world_ids jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  world_id uuid NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  key text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (world_id, key)
);
`;
