-- Runs after migrations on `supabase db reset`. Topics only: posts need real signed-in
-- authors, so sample notes for the UI live in src/lib/mock/data.ts instead.

insert into public.topics (slug, name_az, name_en, description_az, description_en) values
  ('typescript', 'TypeScript', 'TypeScript', 'Tiplər, kompilyator və gündəlik işdə kömək edən kiçik hiylələr.', 'Types, the compiler and small tricks that help day to day.'),
  ('javascript', 'JavaScript', 'JavaScript', 'Dilin özü, brauzer və Node haqqında kiçik kəşflər.', 'Small finds about the language, the browser and Node.'),
  ('git', 'Git', 'Git', 'Terminalda vaxta qənaət edən əmrlər.', 'Commands that save time in the terminal.'),
  ('metbex', 'Mətbəx', 'Cooking', 'Yemək, dəm və dadın arxasındakı səbəblər.', 'Food, brewing and the reasons behind the taste.'),
  ('tarix', 'Tarix', 'History', 'Bakıdan Şəkiyə, yerlərin və əşyaların hekayəsi.', 'From Baku to Sheki, the stories of places and things.')
on conflict (slug) do nothing;
