-- Win rate aggregation function per model per category (BATTLE-05, D-09, D-10)
-- Called via: supabase.rpc('get_model_win_rates', { category_filter: 'general' })
-- Returns: [{ model_id, wins, total }, ...]
CREATE OR REPLACE FUNCTION get_model_win_rates(category_filter text DEFAULT 'general')
RETURNS TABLE (
  model_id text,
  wins bigint,
  total bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH battle_models AS (
    -- Unnest each completed battle into individual model participation records
    SELECT b.id as battle_id, b.model_a as model_id,
           CASE WHEN v.winner = 'a' THEN 1 ELSE 0 END as won
    FROM battles b
    JOIN votes v ON v.battle_id = b.id
    WHERE b.status = 'completed' AND b.category = category_filter
    UNION ALL
    SELECT b.id as battle_id, b.model_b as model_id,
           CASE WHEN v.winner = 'b' THEN 1 ELSE 0 END as won
    FROM battles b
    JOIN votes v ON v.battle_id = b.id
    WHERE b.status = 'completed' AND b.category = category_filter
  )
  SELECT
    bm.model_id,
    SUM(bm.won)::bigint as wins,
    COUNT(*)::bigint as total
  FROM battle_models bm
  GROUP BY bm.model_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add unique constraint on votes.battle_id to prevent double voting (Pitfall 4)
-- Each battle can have exactly one vote
ALTER TABLE votes ADD CONSTRAINT votes_battle_id_unique UNIQUE (battle_id);
