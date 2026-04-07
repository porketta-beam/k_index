-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Battles table: stores complete battle data (per D-06)
-- Anonymous storage, no user identification (per D-05)
create table battles (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  model_a text not null,
  model_b text not null,
  response_a text,
  response_b text,
  position_a text not null check (position_a in ('left', 'right')),
  category text not null default 'general',
  status text not null default 'pending'
    check (status in ('pending', 'streaming', 'voting', 'completed', 'error')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Votes table: records which side won
create table votes (
  id uuid primary key default uuid_generate_v4(),
  battle_id uuid not null references battles(id) on delete cascade,
  winner text not null check (winner in ('a', 'b')),
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_battles_status on battles(status);
create index idx_battles_category on battles(category);
create index idx_battles_created_at on battles(created_at desc);
create index idx_votes_battle_id on votes(battle_id);
