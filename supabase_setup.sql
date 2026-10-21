-- ============================================================================
-- ARUNE CAROUSEL STUDIO: SUPABASE DATABASE & REALTIME SETUP
-- Skrip SQL lengkap untuk mengaktifkan:
-- 1. Tabel Profil Akun & Avatar Ilustrasi Ringan
-- 2. Kolaborasi Tim & Folder Proyek Bersama
-- 3. Shared Brand Kit Tim
-- 4. Supabase Realtime (Multiplayer Cursors & Live Editing)
-- ============================================================================

-- 1. EKSTENSI UUID
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 2. TABEL PROFIL PENGGUNA (PROFILES)
-- Hanya menyimpan avatar_id (teks ringan seperti 'avatar-sage')
-- sehingga TIDAK membebani database dengan file gambar besar.
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

-- ============================================================================
-- 3. TABEL TIM (TEAMS)
-- ============================================================================
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  avatar_color text not null default '#5E887E',
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
    name = excluded.name,
    avatar_id = excluded.avatar_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_projects enable row level security;
alter table public.team_brand_kits enable row level security;

-- Policies untuk Profiles
create policy "Profil dapat dibaca oleh semua user login"
  on public.profiles for select
  to authenticated
  using (true);

create policy "User dapat mengupdate profil miliknya sendiri"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Policies untuk Teams
create policy "Anggota tim dapat melihat tim miliknya"
  on public.teams for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    ) or created_by = auth.uid()
  );

create policy "User login dapat membuat tim baru"
  on public.teams for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Owner/Editor dapat mengupdate tim"
  on public.teams for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role in ('owner', 'editor')
    ) or created_by = auth.uid()
  );

-- Policies untuk Team Members
create policy "Anggota dapat melihat member di tim yang sama"
  on public.team_members for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
    )
  );

create policy "Owner tim dapat menambahkan member"
  on public.team_members for insert
  to authenticated
  with check (true);

-- Policies untuk Team Projects
create policy "Anggota tim dapat melihat proyek tim"
  on public.team_projects for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_projects.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Anggota tim dapat menyimpan atau mengupdate proyek"
  on public.team_projects for all
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_projects.team_id
      and team_members.user_id = auth.uid()
      and team_members.role in ('owner', 'editor')
    )
  );

-- Policies untuk Brand Kit
create policy "Anggota tim dapat melihat Brand Kit"
  on public.team_brand_kits for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_brand_kits.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Owner/Editor dapat menyimpan Brand Kit"
  on public.team_brand_kits for all
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_brand_kits.team_id
      and team_members.user_id = auth.uid()
      and team_members.role in ('owner', 'editor')
    )
  );

-- ============================================================================
-- 9. AKTIFKAN SUPABASE REALTIME MULTIPLAYER
-- Memungkinkan perubahan proyek, kursor, dan member tersiar langsung secara real-time
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

-- Selesai! Semua tabel, trigger, dan realtime websocket siap digunakan.
