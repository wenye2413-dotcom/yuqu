-- ============================================================
-- 友趣 — 添加位置功能（在 Supabase SQL Editor 执行）
-- ============================================================

-- 1. posts 表添加经纬度字段
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- 2. 创建索引（按位置查询加速）
CREATE INDEX IF NOT EXISTS idx_posts_location
ON public.posts USING gist (ll_to_earth(latitude, longitude));

-- 3. 启用 earthdistance 和 cube 扩展（用于地理距离计算）
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
