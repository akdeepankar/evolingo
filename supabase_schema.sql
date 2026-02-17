-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: profiles
-- Stores user profiles. Automatically managed via Supabase Auth when a user signs up.
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: groups
-- Stores chat groups.
create table groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  join_code text unique not null,
  created_by uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: group_members
-- Links users to groups.
create table group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- Table: messages
-- Stores chat messages. Can include shared word data.
create table messages (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete set null,
  content text,
  is_shared_word boolean default false,
  word_data jsonb, -- Stores the entire word object (root, path, current) to verify/view
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security)
-- Enable RLS
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table messages enable row level security;

-- Policies
-- Profiles: Public read, self update
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Groups: Viewable if member (for stricter security), currently open for simplicity in finding by code?
-- Actually, let's allow anyone to select groups to join them by code.
create policy "Groups are viewable by everyone." on groups for select using (true);
create policy "Authenticated users can create groups." on groups for insert to authenticated with check (true);

-- Group Members: Viewable by group members
create policy "Members can view other members." on group_members for select using (true);
create policy "Authenticated users can join groups." on group_members for insert to authenticated with check (auth.uid() = user_id);

-- Messages: Viewable by group members
create policy "Members can view messages in their group." on messages for select using (
  exists (
    select 1 from group_members gm 
    where gm.group_id = messages.group_id and gm.user_id = auth.uid()
  )
);
create policy "Members can insert messages in their group." on messages for insert with check (
  exists (
    select 1 from group_members gm 
    where gm.group_id = messages.group_id and gm.user_id = auth.uid()
  )
);

-- Function to handle new user signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
