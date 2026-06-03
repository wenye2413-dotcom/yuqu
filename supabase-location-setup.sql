-- ============================================================
-- 友趣 — 位置 + 用户关联 + 实时消息
-- 在 Supabase SQL Editor 逐条执行
-- ============================================================

-- 1. posts 表加经纬度（位置功能需要）
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS longitude double precision;

-- 2. 修复 profiles RLS（让用户能看到彼此的名字）
DROP POLICY IF EXISTS "所有用户可查看资料" ON public.profiles;
CREATE POLICY "所有用户可查看资料"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. 启用 Realtime（别人发新消息时自动出现在你页面）
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
