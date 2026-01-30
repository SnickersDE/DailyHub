-- Add friend_code to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'friend_code') THEN
        ALTER TABLE profiles ADD COLUMN friend_code text UNIQUE;
    END IF;
END $$;

-- Update the handle_new_user function to generate a random friend code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, friend_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    upper(substring(md5(random()::text) from 1 for 6)) -- Generate random 6-char code
  );
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search user by friend code
CREATE OR REPLACE FUNCTION get_user_by_friend_code(code_input text)
RETURNS TABLE (id uuid, username text, avatar_url text) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.avatar_url
  FROM profiles p
  WHERE p.friend_code = upper(code_input);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
