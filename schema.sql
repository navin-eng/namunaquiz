
-- Create Quizzes Table
CREATE TABLE public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id)
);

-- Toggle RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Questions Table
CREATE TABLE public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  time_limit INTEGER DEFAULT 20,
  options JSONB NOT NULL, -- [{text, isCorrect}, ...]
  order_index INTEGER DEFAULT 0
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Game Sessions Table
CREATE TABLE public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  pin TEXT NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting, active, finished
  current_question_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  host_id UUID REFERENCES auth.users(id)
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Players Table
CREATE TABLE public.players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_answer_status TEXT DEFAULT NULL, -- 'correct', 'incorrect', or null
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Quizzes/Questions: Public Read, Auth Write
CREATE POLICY "Public quizzes view" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Auth quizzes insert" ON public.quizzes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth quizzes update" ON public.quizzes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth quizzes delete" ON public.quizzes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Public questions view" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Auth questions insert" ON public.questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth questions update" ON public.questions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth questions delete" ON public.questions FOR DELETE USING (auth.role() = 'authenticated');

-- Game Sessions: Public Read (to join), Auth Insert/Update
CREATE POLICY "Public sessions view" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "Auth sessions insert" ON public.game_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth sessions update" ON public.game_sessions FOR UPDATE USING (auth.role() = 'authenticated');

-- Players: Public Insert (Join), Public Update (Score - handled by logic, actually ideally secure but for MVP public is ok?)
-- Ideally only the Host updates scores, or players update their own.
-- Let's allow public insert for joining.
CREATE POLICY "Public players view" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public players insert" ON public.players FOR INSERT WITH CHECK (true); 
CREATE POLICY "Public players update" ON public.players FOR UPDATE USING (true); -- Needed for real-time score updates if client-driven, or host-driven.

-- Realtime
-- Enable realtime for game_sessions and players
alter publication supabase_realtime add table game_sessions;
alter publication supabase_realtime add table players;
