create table if not exists companies (
  id text primary key,
  name text not null,
  domain text not null,
  industry text not null default '',
  plan text not null default 'starter',
  status text not null default 'active',
  seats integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists enrollment_codes (
  code text primary key,
  company_id text not null references companies(id) on delete cascade,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists enrollment_codes_company_idx
  on enrollment_codes (company_id);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  email text not null,
  name text not null default '',
  area text not null default '',
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create table if not exists installations (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  extension_version text not null default '',
  status text not null default 'active',
  enrolled_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index if not exists installations_company_idx
  on installations (company_id);

-- events.id lo genera la extensión. Es lo que hace idempotente al reintento.
create table if not exists events (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  installation_id uuid not null references installations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  provider text not null,
  decision text not null,
  resolution text not null,
  top_severity text not null,
  score integer not null default 0,
  duration_ms integer not null default 0
);

create index if not exists events_company_time_idx
  on events (company_id, occurred_at desc);

create table if not exists event_rules (
  event_id text not null references events(id) on delete cascade,
  rule_id text not null,
  rule_source text not null,
  category text not null,
  severity text not null,
  primary key (event_id, rule_id)
);

create table if not exists heartbeats (
  id bigserial primary key,
  installation_id uuid not null references installations(id) on delete cascade,
  reported_at timestamptz not null default now(),
  extension_version text not null default '',
  analyzed_count bigint not null default 0,
  allowed_count bigint not null default 0,
  warned_count bigint not null default 0,
  blocked_count bigint not null default 0,
  redacted_count bigint not null default 0,
  dropped_count bigint not null default 0
);

create table if not exists custom_rules (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  name text not null,
  description text not null default '',
  keywords jsonb not null default '[]'::jsonb,
  severity text not null,
  action text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table if not exists enroll_attempts (
  id bigserial primary key,
  ip text not null,
  attempted_at timestamptz not null default now(),
  succeeded boolean not null default false
);

create index if not exists enroll_attempts_ip_idx
  on enroll_attempts (ip, attempted_at desc);
