CREATE TABLE public.admin_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_key TEXT NOT NULL,
  sem_id TEXT,
  subject_id TEXT,
  chapter_id TEXT,
  topic_id TEXT,
  type TEXT NOT NULL DEFAULT 'file',
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  mime TEXT,
  text_content TEXT,
  uploaded_by TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX admin_materials_topic_key_idx ON public.admin_materials (topic_key);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_materials TO authenticated;
GRANT ALL ON public.admin_materials TO service_role;

ALTER TABLE public.admin_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view study materials"
  ON public.admin_materials FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add study materials"
  ON public.admin_materials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update study materials"
  ON public.admin_materials FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can remove study materials"
  ON public.admin_materials FOR DELETE
  USING (true);