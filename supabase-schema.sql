-- ============================================================
-- Ministerio de Alabanza — Supabase Schema
-- Pega este script en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Songs
create table if not exists songs (
  id           bigserial primary key,
  title        text not null,
  author       text default '',
  key          text default 'C',
  tempo        integer default 80,
  genre        text default 'Contemporáneo',
  language     text default 'Español',
  last_used    date,
  times_used   integer default 0,
  tags         text[] default '{}',
  created_at   timestamptz default now()
);

-- Users
create table if not exists users (
  id           text primary key,
  name         text not null,
  email        text not null unique,
  password     text not null,
  role         text not null default 'musico',
  title        text default '',
  initials     text default '',
  avatar       text,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- Events
create table if not exists events (
  id              bigserial primary key,
  title           text not null,
  date            date not null,
  time            text default '10:00',
  type            text default 'Culto Principal',
  director_id     text references users(id) on delete set null,
  director_name   text default '',
  songs           bigint[] default '{}',
  status          text default 'upcoming',
  notes           text default '',
  created_at      timestamptz default now()
);

-- Song History
create table if not exists song_history (
  id             text primary key,
  song_id        bigint references songs(id) on delete cascade,
  date           date,
  event_title    text,
  event_type     text,
  director_name  text,
  created_at     timestamptz default now()
);

-- Change Requests
create table if not exists requests (
  id                      text primary key,
  requester_id            text,
  requester_name          text,
  requester_role          text,
  original_event_id       bigint,
  original_event_title    text,
  original_date           date,
  request_type            text,
  requested_date          date,
  swap_with_event_id      bigint,
  swap_with_director_name text,
  reason                  text,
  status                  text default 'pending',
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  reviewed_by             text,
  reviewed_by_name        text,
  reviewed_at             timestamptz,
  review_comment          text
);

-- Notifications
create table if not exists notifications (
  id                text primary key,
  type              text,
  title             text,
  body              text,
  related_id        text,
  recipient_roles   text[] default '{}',
  recipient_user_id text,
  is_read           boolean default false,
  created_at        timestamptz default now()
);

-- Audit Logs
create table if not exists audit_logs (
  id                  text primary key,
  action_type         text,
  performed_by        text,
  performed_by_name   text,
  target_entity       text,
  target_entity_id    text,
  description         text,
  previous_value      jsonb,
  new_value           jsonb,
  timestamp           timestamptz default now()
);

-- ── Row Level Security (permissivo para equipo de confianza) ──────────────
alter table songs         enable row level security;
alter table users         enable row level security;
alter table events        enable row level security;
alter table song_history  enable row level security;
alter table requests      enable row level security;
alter table notifications enable row level security;
alter table audit_logs    enable row level security;

create policy "allow_all" on songs         for all using (true) with check (true);
create policy "allow_all" on users         for all using (true) with check (true);
create policy "allow_all" on events        for all using (true) with check (true);
create policy "allow_all" on song_history  for all using (true) with check (true);
create policy "allow_all" on requests      for all using (true) with check (true);
create policy "allow_all" on notifications for all using (true) with check (true);
create policy "allow_all" on audit_logs    for all using (true) with check (true);
