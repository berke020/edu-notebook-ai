-- Core tables for dashboard + personalization (BIGINT schema)

create table if not exists courses (
  id bigint primary key generated always as identity,
  name text not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists chat_sessions
  add column if not exists course_id bigint references courses(id),
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists category_id text,
  add column if not exists category_label text,
  add column if not exists project_config jsonb,
  add column if not exists tags text[];

create table if not exists events (
  id bigint primary key generated always as identity,
  title text not null,
  event_date date not null,
  course_id bigint references courses(id),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists personas (
  id bigint primary key generated always as identity,
  category_id text not null,
  name text not null,
  profile jsonb not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists user_stats (
  id int primary key default 1,
  user_id uuid references auth.users(id) on delete cascade,
  streak int default 0,
  level text default 'Çırak Araştırmacı',
  last_activity date,
  quiz_correct int default 0,
  quiz_total int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists user_stats_user_id_idx on user_stats(user_id);

create table if not exists user_profiles (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  role_label text,
  education_level text,
  institution text,
  department text,
  goal text,
  focus_topics text,
  weekly_goal_hours int,
  daily_goal_minutes int,
  study_style text,
  favorite_tools text[],
  pomodoro_work int,
  pomodoro_break int,
  reminder_pref text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists user_profiles_user_id_idx on user_profiles(user_id);

create table if not exists community_notes (
  id bigint primary key generated always as identity,
  doc_hash text not null,
  note_type text not null,
  payload jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists interaction_history (
  id bigint primary key generated always as identity,
  session_id bigint references chat_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  tool_id text not null,
  tool_label text,
  preview text,
  payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists room_shares (
  id bigint primary key generated always as identity,
  session_id bigint references chat_sessions(id) on delete cascade,
  token text unique not null,
  role text default 'viewer',
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table room_shares enable row level security;
create policy "Herkese açık (Test için)" on room_shares for all using (true);

create table if not exists room_share_access (
  id bigint primary key generated always as identity,
  share_id bigint references room_shares(id) on delete cascade,
  session_id bigint references chat_sessions(id) on delete cascade,
  role text,
  user_id uuid references auth.users(id) on delete set null,
  user_agent text,
  accessed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table room_share_access enable row level security;
create policy "Herkese açık (Test için)" on room_share_access for all using (true);

create table if not exists jury_memory (
  id bigint primary key generated always as identity,
  session_id bigint references chat_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  category_id text,
  text text not null,
  tag text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table jury_memory enable row level security;
create policy "Herkese açık (Test için)" on jury_memory for all using (true);

create table if not exists jury_videos (
  id bigint primary key generated always as identity,
  session_id bigint references chat_sessions(id) on delete cascade,
  category_id text,
  file_name text,
  mime_type text,
  data_base64 text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table documents
  add column if not exists text_content text,
  add column if not exists source_url text,
  add column if not exists tags text[];
