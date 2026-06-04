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

-- 4. 为没有 profile 的老用户补一条记录（用邮箱前缀做默认名）
INSERT INTO public.profiles (id, name, avatar_url, bio)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  '',
  ''
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. 通知表
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'reply',
  actor_id UUID,
  post_id UUID,
  reply_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户可查看自己的通知"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "系统可插入通知"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 6. 自动创建通知触发器（有人回复时）
CREATE OR REPLACE FUNCTION public.handle_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
  IF post_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id, reply_id)
    VALUES (post_author_id, 'reply', NEW.user_id, NEW.post_id, NEW.id);
  END IF;
  IF NEW.parent_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id, reply_id)
    SELECT pr.user_id, 'reply', NEW.user_id, NEW.post_id, NEW.id
    FROM public.post_replies pr
    WHERE pr.id = NEW.parent_id AND pr.user_id != NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_reply_insert ON public.post_replies;
CREATE TRIGGER on_reply_insert
  AFTER INSERT ON public.post_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reply_notification();

-- 7. 通知表开 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 8. 活动表
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  event_time TIMESTAMPTZ,
  latitude double precision,
  longitude double precision,
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "events_select" ON public.events FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "events_insert" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. 作品表
CREATE TABLE IF NOT EXISTS public.works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  cover_url TEXT,
  file_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "works_select" ON public.works FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "works_insert" ON public.works FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. 活动报名表
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "reg_select" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.events WHERE id = event_id));
CREATE POLICY IF NOT EXISTS "reg_insert" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "reg_update" ON public.event_registrations FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.events WHERE id = event_id));
