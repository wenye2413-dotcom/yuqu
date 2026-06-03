-- ============================================================
-- Warm Circle Supabase 数据库初始化脚本
-- 使用方法：在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 1. 创建 profiles 表（关联 auth.users）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS 策略
CREATE POLICY "所有用户可查看资料"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "用户可以创建自己的资料"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. 创建 avatars 存储桶（公开读）
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 5. 存储桶 RLS 策略
CREATE POLICY "头像公开可读"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "用户可以上传自己的头像"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "用户可以更新自己的头像"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- 6. 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '',
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 如果触发器已存在则忽略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;
