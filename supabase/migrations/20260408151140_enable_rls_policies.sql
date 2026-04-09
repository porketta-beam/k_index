-- Enable RLS on all public tables per Supabase security best practices.
-- Grants read-only access to anon role; all writes use service_role (bypasses RLS).

-- 1. Enable RLS on battles
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

-- 2. Allow anon role to SELECT battles (needed for leaderboard/public data)
CREATE POLICY "anon_read_battles"
  ON battles
  FOR SELECT
  TO anon
  USING (true);

-- 3. Enable RLS on votes
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 4. Allow anon role to SELECT votes
CREATE POLICY "anon_read_votes"
  ON votes
  FOR SELECT
  TO anon
  USING (true);
