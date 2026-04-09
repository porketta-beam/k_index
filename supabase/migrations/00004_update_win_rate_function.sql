-- Phase 4: Add season_filter to win rate function (D-09, SEASON-02)
-- Uses DEFAULT NULL for backward compatibility -- existing calls without season_filter still work.
-- PostgreSQL allows adding parameters with defaults via CREATE OR REPLACE FUNCTION.

CREATE OR REPLACE FUNCTION get_model_win_rates(
  category_filter text DEFAULT 'general',
  season_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  model_id text,
  wins bigint,
  total bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH battle_models AS (
    SELECT b.id as battle_id, b.model_a as model_id,
           CASE WHEN v.winner = 'a' THEN 1 ELSE 0 END as won
    FROM battles b
    JOIN votes v ON v.battle_id = b.id
    WHERE b.status = 'completed'
      AND b.category = category_filter
      AND (season_filter IS NULL OR b.season_id = season_filter)
    UNION ALL
    SELECT b.id as battle_id, b.model_b as model_id,
           CASE WHEN v.winner = 'b' THEN 1 ELSE 0 END as won
    FROM battles b
    JOIN votes v ON v.battle_id = b.id
    WHERE b.status = 'completed'
      AND b.category = category_filter
      AND (season_filter IS NULL OR b.season_id = season_filter)
  )
  SELECT
    bm.model_id,
    SUM(bm.won)::bigint as wins,
    COUNT(*)::bigint as total
  FROM battle_models bm
  GROUP BY bm.model_id;
END;
$$ LANGUAGE plpgsql STABLE;
