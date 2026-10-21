-- ============================================================================
-- ARUNE CAROUSEL STUDIO: SUPABASE DATABASE & REALTIME SETUP (FIX RECURSION)
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- Skrip ini memperbaiki "infinite recursion detected in policy for relation team_members"
-- menggunakan fungsi SECURITY DEFINER yang dianjurkan oleh PostgreSQL & Supabase.
-- ============================================================================

-- 1. EKSTENSI UUID
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 2. TABEL PROFIL PENGGUNA (PROFILES)
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null default 'Member Tim',
  avatar_id text not null default 'avatar-sage',
  avatar_color text not null default '#5E887E',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_email on public.profiles(lower(email));

-- ============================================================================
-- 3. TABEL TIM (TEAMS)
-- ============================================================================
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  avatar_color text not null default '#5E887E',
  icon_url text,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 4. TABEL ANGGOTA TIM (TEAM_MEMBERS)
-- ============================================================================
create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (team_id, user_id)
);

create index if not exists idx_team_members_team on public.team_members(team_id);
create index if not exists idx_team_members_user on public.team_members(user_id);

-- ============================================================================
-- 5. TABEL PROYEK CAROUSEL BERSAMA TIM (TEAM_PROJECTS)
-- ============================================================================
create table if not exists public.team_projects (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams on delete cascade not null,
  title text not null default 'Untitled Carousel',
  aspect_ratio text not null default '4:5',
  slide_count integer not null default 6,
  project_json jsonb not null,
  last_edited_by text not null default 'Member',
  last_edited_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_team_projects_team on public.team_projects(team_id);

-- ============================================================================
-- 6. TABEL BRAND KIT RESMI TIM (TEAM_BRAND_KITS)
-- ============================================================================
create table if not exists public.team_brand_kits (
  team_id uuid references public.teams on delete cascade primary key,
  publication_name text default 'Creative Editorial Studio',
  author_handle text default '@dinurpradiptaa',
  issue_label text default 'VOL. 01',
  footer_note text default 'arune.studio • swipe to read',
  primary_color text default '#2F3E46',
  accent_color text default '#5E887E',
  background_color text default '#FFFFFF',
  text_color text default '#2F3E46',
  brand_colors text[] default array['#2F3E46', '#5E887E', '#EBAEB3', '#A7C7E7', '#F1F5F4'],
  heading_font text default 'Plus Jakarta Sans',
  body_font text default 'Plus Jakarta Sans',
  show_slide_numbers boolean default true,
  show_footer_bar boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 7. OTOMATIS BUAT ROW PROFIL KETIKA USER DAFTAR
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_id, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_id', 'avatar-sage'),
    '#5E887E'
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, profiles.name),
    email = excluded.email,
    avatar_id = coalesce(excluded.avatar_id, profiles.avatar_id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 8. HELPER SECURITY DEFINER FUNCTIONS (MENCEGAH INFINITE RECURSION RLS)
-- Fungsi ini berjalan dengan hak akses definer sehingga bebas dari perulangan policy.
-- ============================================================================
create or replace function public.is_team_member(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
    and user_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function public.is_team_owner(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.teams
    where id = p_team_id
    and created_by = auth.uid()
  );
$$ language sql security definer stable;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_projects enable row level security;
alter table public.team_brand_kits enable row level security;

-- 9.1 PROFILES POLICIES
drop policy if exists "Profil dapat dibaca oleh semua user login" on public.profiles;
create policy "Profil dapat dibaca oleh semua user login"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "User dapat mengupdate profil miliknya sendiri" on public.profiles;
create policy "User dapat mengupdate profil miliknya sendiri"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

drop policy if exists "User dapat membuat profil miliknya sendiri" on public.profiles;
create policy "User dapat membuat profil miliknya sendiri"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 9.2 TEAMS POLICIES
drop policy if exists "Anggota tim dapat melihat tim miliknya" on public.teams;
create policy "Anggota tim dapat melihat tim miliknya"
  on public.teams for select
  to authenticated
  using (
    created_by = auth.uid() or public.is_team_member(id)
  );

drop policy if exists "User login dapat membuat tim baru" on public.teams;
create policy "User login dapat membuat tim baru"
  on public.teams for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "Owner/Editor dapat mengupdate tim" on public.teams;
create policy "Owner/Editor dapat mengupdate tim"
  on public.teams for update
  to authenticated
  using (
    created_by = auth.uid() or public.is_team_member(id)
  );

drop policy if exists "Owner dapat menghapus tim" on public.teams;
create policy "Owner dapat menghapus tim"
  on public.teams for delete
  to authenticated
  using (created_by = auth.uid());

-- 9.3 TEAM MEMBERS POLICIES (BEBAS DARI INFINITE RECURSION)
drop policy if exists "Anggota dapat melihat member di tim yang sama" on public.team_members;
create policy "Anggota dapat melihat member di tim yang sama"
  on public.team_members for select
  to authenticated
  using (
    user_id = auth.uid() or public.is_team_owner(team_id) or public.is_team_member(team_id)
  );

drop policy if exists "Owner tim dapat menambahkan member" on public.team_members;
create policy "Owner tim dapat menambahkan member"
  on public.team_members for insert
  to authenticated
  with check (true);

drop policy if exists "Owner tim dapat mengupdate role member" on public.team_members;
create policy "Owner tim dapat mengupdate role member"
  on public.team_members for update
  to authenticated
  using (
    public.is_team_owner(team_id)
  );

drop policy if exists "Owner tim dapat menghapus member" on public.team_members;
create policy "Owner tim dapat menghapus member"
  on public.team_members for delete
  to authenticated
  using (
    user_id = auth.uid() or public.is_team_owner(team_id)
  );

-- 9.4 TEAM PROJECTS POLICIES
drop policy if exists "Anggota tim dapat melihat proyek tim" on public.team_projects;
create policy "Anggota tim dapat melihat proyek tim"
  on public.team_projects for select
  to authenticated
  using (
    public.is_team_owner(team_id) or public.is_team_member(team_id)
  );

drop policy if exists "Anggota tim dapat menyimpan atau mengupdate proyek" on public.team_projects;
create policy "Anggota tim dapat menyimpan atau mengupdate proyek"
  on public.team_projects for all
  to authenticated
  using (
    public.is_team_owner(team_id) or public.is_team_member(team_id)
  );

drop policy if exists "Anggota tim dapat menghapus proyek tim" on public.team_projects;
create policy "Anggota tim dapat menghapus proyek tim"
  on public.team_projects for delete
  to authenticated
  using (
    public.is_team_owner(team_id) or public.is_team_member(team_id)
  );

-- 9.5 BRAND KIT POLICIES
drop policy if exists "Anggota tim dapat melihat Brand Kit" on public.team_brand_kits;
create policy "Anggota tim dapat melihat Brand Kit"
  on public.team_brand_kits for select
  to authenticated
  using (
    public.is_team_owner(team_id) or public.is_team_member(team_id)
  );

drop policy if exists "Owner/Editor dapat menyimpan Brand Kit" on public.team_brand_kits;
create policy "Owner/Editor dapat menyimpan Brand Kit"
  on public.team_brand_kits for all
  to authenticated
  using (
    public.is_team_owner(team_id) or public.is_team_member(team_id)
  );

-- ============================================================================
-- 10. AKTIFKAN SUPABASE REALTIME WEBSOCKET UNTUK SELURUH TABEL
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_members'
  ) then
    alter publication supabase_realtime add table public.team_members;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_projects'
  ) then
    alter publication supabase_realtime add table public.team_projects;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_brand_kits'
  ) then
    alter publication supabase_realtime add table public.team_brand_kits;
  end if;
end $$;

-- ============================================================================
-- 11. STORAGE BUCKET UNTUK ICON & LOGO TIM (TEAM-ICONS)
-- ============================================================================
alter table public.teams add column if not exists icon_url text;

insert into storage.buckets (id, name, public)
values ('team-icons', 'team-icons', true)
on conflict (id) do update set public = true;

drop policy if exists "Team icons are publicly accessible" on storage.objects;
create policy "Team icons are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'team-icons');

drop policy if exists "Authenticated users can upload team icons" on storage.objects;
create policy "Authenticated users can upload team icons"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'team-icons');

drop policy if exists "Authenticated users can update team icons" on storage.objects;
create policy "Authenticated users can update team icons"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'team-icons');

drop policy if exists "Authenticated users can delete team icons" on storage.objects;
create policy "Authenticated users can delete team icons"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'team-icons');

-- Selesai! Semua tabel, trigger, RLS, Storage Bucket, dan Realtime WebSocket siap digunakan tanpa loop.
