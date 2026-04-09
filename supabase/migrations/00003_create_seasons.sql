-- Phase 4: Season system tables (SEASON-01, SEASON-04, D-08)

-- Seasons table: tracks season lifecycle
CREATE TABLE seasons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_number integer NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended')),
  threshold integer NOT NULL,
  battle_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- Add season_id to battles (nullable for backward compatibility with pre-season battles)
ALTER TABLE battles ADD COLUMN season_id uuid REFERENCES seasons(id);

-- Indexes for fast lookups
CREATE INDEX idx_battles_season_id ON battles(season_id);
CREATE INDEX idx_seasons_status ON seasons(status);
