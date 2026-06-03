-- ============================================================
-- 友趣 — 位置 + 用户关联修复
-- 在 Supabase SQL Editor 执行
-- ============================================================

-- 1. posts 表加经纬度
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- 2. 修复 profiles 的 RLS：允许所有登录用户查看所有公开资料
--    （之前的策略只允许看自己的，导致消息作者名都显示"用户"）
DROP POLICY IF EXISTS "用户可以查看自己的资料" ON public.profiles;
DROP POLICY IF EXISTS "所有用户可查看资料" ON public.profiles;
CREATE POLICY "所有用户可查看资料"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. 确认其他策略仍在
SELECT * FROM pg_policies WHERE tablename = 'profiles';
