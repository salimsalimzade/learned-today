-- Runs after migrations on `supabase db reset`: 200 topics, sample authors and sample notes
-- so the feed isn't empty locally. The authors are fake auth users (@seed.invalid) and the
-- trigger in 0003 creates their profiles. Reactions are only seeded for the demo account;
-- the other reaction counts from the old mock data are not recreated.

insert into public.topics (slug, name) values
  ('javascript', 'JavaScript'),
  ('typescript', 'TypeScript'),
  ('python', 'Python'),
  ('java', 'Java'),
  ('csharp', 'C#'),
  ('cpp', 'C++'),
  ('c', 'C'),
  ('go', 'Go'),
  ('rust', 'Rust'),
  ('php', 'PHP'),
  ('kotlin', 'Kotlin'),
  ('swift', 'Swift'),
  ('ruby', 'Ruby'),
  ('sql', 'SQL'),
  ('html-css', 'HTML and CSS'),
  ('bash', 'Bash and terminal'),
  ('git', 'Git'),
  ('github', 'GitHub'),
  ('docker', 'Docker'),
  ('kubernetes', 'Kubernetes'),
  ('linux', 'Linux'),
  ('web-development', 'Web development'),
  ('mobile-development', 'Mobile development'),
  ('iot', 'IoT and devices'),
  ('game-development', 'Game development'),
  ('data-science', 'Data science'),
  ('machine-learning', 'Machine learning'),
  ('ai', 'Artificial intelligence'),
  ('databases', 'Databases'),
  ('apis', 'APIs'),
  ('testing', 'Testing and QA'),
  ('devops', 'DevOps'),
  ('cloud', 'Cloud'),
  ('security', 'Security'),
  ('algorithms', 'Algorithms'),
  ('react', 'React'),
  ('nodejs', 'Node.js'),
  ('accessibility', 'Accessibility'),
  ('open-source', 'Open source'),
  ('career', 'Career'),
  ('kitchen', 'Kitchen'),
  ('cooking-techniques', 'Cooking techniques'),
  ('baking', 'Baking'),
  ('desserts', 'Desserts'),
  ('coffee', 'Coffee'),
  ('tea', 'Tea'),
  ('drinks', 'Drinks'),
  ('meat', 'Meat dishes'),
  ('fish-seafood', 'Fish and seafood'),
  ('vegetables', 'Vegetables'),
  ('fruits', 'Fruits'),
  ('soups', 'Soups'),
  ('salads', 'Salads'),
  ('rice-pasta', 'Rice and pasta'),
  ('spices', 'Spices'),
  ('azerbaijani-cuisine', 'Azerbaijani cuisine'),
  ('world-cuisine', 'World cuisine'),
  ('vegetarian', 'Vegetarian food'),
  ('food-safety', 'Food safety'),
  ('grilling', 'Grilling and barbecue'),
  ('home-repair', 'Home repair'),
  ('plumbing', 'Plumbing'),
  ('electrical', 'Electrical'),
  ('carpentry', 'Carpentry'),
  ('painting', 'Painting and plaster'),
  ('appliances', 'Appliances'),
  ('furniture', 'Furniture'),
  ('tools', 'Tools'),
  ('garden', 'Garden'),
  ('cleaning', 'Cleaning'),
  ('car-repair', 'Car repair'),
  ('sewing', 'Sewing'),
  ('diy', 'DIY'),
  ('history', 'History'),
  ('azerbaijan-history', 'History of Azerbaijan'),
  ('world-history', 'World history'),
  ('wars', 'Wars'),
  ('architecture', 'Architecture'),
  ('archaeology', 'Archaeology'),
  ('geography', 'Geography'),
  ('cities', 'Cities'),
  ('politics', 'Politics'),
  ('law', 'Law'),
  ('economics', 'Economics'),
  ('philosophy', 'Philosophy'),
  ('religion', 'Religion'),
  ('science', 'Science'),
  ('physics', 'Physics'),
  ('chemistry', 'Chemistry'),
  ('biology', 'Biology'),
  ('mathematics', 'Mathematics'),
  ('statistics', 'Statistics'),
  ('astronomy', 'Astronomy'),
  ('space', 'Space'),
  ('medicine', 'Medicine'),
  ('neuroscience', 'Neuroscience'),
  ('ecology', 'Ecology'),
  ('climate', 'Climate'),
  ('weather', 'Weather'),
  ('energy', 'Energy'),
  ('engineering', 'Engineering'),
  ('electronics', 'Electronics'),
  ('robotics', 'Robotics'),
  ('health', 'Health'),
  ('nutrition', 'Nutrition'),
  ('fitness', 'Fitness'),
  ('running', 'Running'),
  ('yoga', 'Yoga'),
  ('sleep', 'Sleep'),
  ('first-aid', 'First aid'),
  ('mental-health', 'Mental health'),
  ('dental', 'Dental health'),
  ('vitamins', 'Vitamins'),
  ('sports', 'Sports'),
  ('football', 'Football'),
  ('chess', 'Chess'),
  ('finance', 'Finance'),
  ('budgeting', 'Budgeting'),
  ('investing', 'Investing'),
  ('taxes', 'Taxes'),
  ('banking', 'Banking'),
  ('crypto', 'Cryptocurrency'),
  ('real-estate', 'Real estate'),
  ('business', 'Business'),
  ('startups', 'Startups'),
  ('marketing', 'Marketing'),
  ('sales', 'Sales'),
  ('management', 'Management'),
  ('entrepreneurship', 'Entrepreneurship'),
  ('accounting', 'Accounting'),
  ('languages', 'Languages'),
  ('azerbaijani-language', 'Azerbaijani language'),
  ('english', 'English language'),
  ('russian', 'Russian language'),
  ('turkish', 'Turkish language'),
  ('german', 'German language'),
  ('grammar', 'Grammar'),
  ('vocabulary', 'Vocabulary'),
  ('literature', 'Literature'),
  ('poetry', 'Poetry'),
  ('books', 'Books'),
  ('writing', 'Writing'),
  ('translation', 'Translation'),
  ('art', 'Art'),
  ('music', 'Music'),
  ('film', 'Film'),
  ('photography', 'Photography'),
  ('drawing', 'Drawing'),
  ('theatre', 'Theatre'),
  ('dance', 'Dance'),
  ('design', 'Design'),
  ('ui-ux', 'UI and UX'),
  ('fashion', 'Fashion'),
  ('crafts', 'Crafts'),
  ('guitar', 'Guitar'),
  ('piano', 'Piano'),
  ('mugham', 'Mugham'),
  ('carpets', 'Carpet weaving'),
  ('video-games', 'Video games'),
  ('board-games', 'Board games'),
  ('nature', 'Nature'),
  ('animals', 'Animals'),
  ('birds', 'Birds'),
  ('dogs', 'Dogs'),
  ('cats', 'Cats'),
  ('plants', 'Plants'),
  ('trees', 'Trees'),
  ('mountains', 'Mountains'),
  ('sea', 'Sea'),
  ('rivers-lakes', 'Rivers and lakes'),
  ('agriculture', 'Agriculture'),
  ('beekeeping', 'Beekeeping'),
  ('travel', 'Travel'),
  ('hiking', 'Hiking'),
  ('camping', 'Camping'),
  ('transport', 'Transport'),
  ('cars', 'Cars'),
  ('aviation', 'Aviation'),
  ('maps', 'Maps'),
  ('parenting', 'Parenting'),
  ('education', 'Education'),
  ('university', 'University'),
  ('productivity', 'Productivity'),
  ('time-management', 'Time management'),
  ('communication', 'Communication'),
  ('psychology', 'Psychology'),
  ('habits', 'Habits'),
  ('learning', 'Learning'),
  ('reading', 'Reading'),
  ('technology', 'Technology'),
  ('internet', 'Internet'),
  ('smartphones', 'Smartphones'),
  ('computers', 'Computers'),
  ('hardware', 'Computer hardware'),
  ('networking', 'Networking'),
  ('privacy', 'Privacy'),
  ('excel', 'Excel'),
  ('office', 'Office apps'),
  ('ai-tools', 'AI tools'),
  ('3d-printing', '3D printing')
on conflict (slug) do update set name = excluded.name;

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data) values
  ('5069441e-414f-9475-7cf0-6ee20cb799d0', 'authenticated', 'authenticated', 'rauf-aliyev@seed.invalid', '{"provider":"github"}', '{"user_name":"rauf-aliyev","full_name":"Rauf Əliyev"}'),
  ('c81ecc36-60ea-dc86-3479-5a15de2ad9ef', 'authenticated', 'authenticated', 'aynur-hasanova@seed.invalid', '{"provider":"google"}', '{"user_name":"aynur-hasanova","full_name":"Aynur Həsənova"}'),
  ('9a51ad1c-6a0b-3a8c-9e73-472bd3707385', 'authenticated', 'authenticated', 'tural-mammadov@seed.invalid', '{"provider":"github"}', '{"user_name":"tural-mammadov","full_name":"Tural Məmmədov"}'),
  ('1744e96b-c86a-9a97-f8a5-2afa539932ea', 'authenticated', 'authenticated', 'narmin-qasimova@seed.invalid', '{"provider":"google"}', '{"user_name":"narmin-qasimova","full_name":"Nərmin Qasımova"}'),
  ('c86400aa-5c34-c719-255a-dd557b6f01e9', 'authenticated', 'authenticated', 'kamran-rzayev@seed.invalid', '{"provider":"github"}', '{"user_name":"kamran-rzayev","full_name":"Kamran Rzayev"}'),
  ('1d1f6675-db20-ab9b-9f66-3e662e65d7cc', 'authenticated', 'authenticated', 'leyla-cafarova@seed.invalid', '{"provider":"github"}', '{"user_name":"leyla-cafarova","full_name":"Leyla Cəfərova"}'),
  ('2adc4b70-4dcf-da24-7958-02840bef95ae', 'authenticated', 'authenticated', 'sebine-q@seed.invalid', '{"provider":"github"}', '{"user_name":"sebine-q","full_name":"Səbinə Quliyeva"}')
on conflict (id) do nothing;

insert into public.posts (id, author_id, topic_slug, title, body_md, published_at, written_by_author) overriding system value values
  (1, '5069441e-414f-9475-7cf0-6ee20cb799d0', 'typescript', 'satisfies checks an object but keeps its exact type', 'For a long time I typed objects like `const routes: Record<string, Route>`. It works, but there is a catch: after that, TypeScript forgets the object''s concrete keys.

So even `routes.blog` raises no error. The type says any string can be a key.

`satisfies` fixes that. It checks that the object matches the type, but keeps the object''s own exact type:

```ts
type Route = { path: string; auth?: boolean };

const routes = {
  home: { path: "/" },
  admin: { path: "/admin", auth: true },
} satisfies Record<string, Route>;

routes.admin.auth; // boolean
routes.blog;       // error: no such key
```

## When do I use it?

In config objects, route tables and colour palettes. Anywhere I want the shape checked and the exact keys kept.

`satisfies` has been in TypeScript since 4.9. More in the [release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html).', '2026-10-17T21:56:31.708Z', true),
  (2, 'c81ecc36-60ea-dc86-3479-5a15de2ad9ef', 'kitchen', 'Why rice for pilaf is soaked in salted water', 'The rice is left in lukewarm salted water for a few hours. The grains soak up the water evenly, so when they steam they stay whole and separate.

The salt seasons the grain from the inside and also firms up its surface a little. That is why the rice doesn''t soften and fall apart as soon as it hits boiling water.

Afterwards the rice is drained and boiled briefly, drained again when it is half cooked, and left to steam.', '2026-10-17T21:56:23.219Z', true),
  (3, '9a51ad1c-6a0b-3a8c-9e73-472bd3707385', 'javascript', 'Destructuring defaults don''t apply to null', 'When you write `const { size = 10 } = opts`, `size` becomes 10 only when it is `undefined`. If the server sends `null`, it stays `null`.

```js
const { size = 10 } = { size: null };
size; // null, not 10

const safe = opts.size ?? 10;
```

`??` works for both `null` and `undefined`. When an API response needs a default, it is the safer choice.', '2026-10-17T21:56:16.219Z', true),
  (4, '2adc4b70-4dcf-da24-7958-02840bef95ae', 'typescript', 'A union type from an object with keyof typeof', 'I keep colour names in an object and I don''t want to write the same list a second time for the type.

```ts
const COLORS = { red: "#b42318", blue: "#2547a8" };

type Color = keyof typeof COLORS; // "red" | "blue"
```

`typeof` takes a type from a value, and `keyof` gives that type''s keys as a union. When I add a new colour to the object, the type updates itself.', '2026-10-17T17:10:00.000Z', true),
  (5, '1744e96b-c86a-9a97-f8a5-2afa539932ea', 'history', 'There isn''t a single nail in the lattices of Sheki Khan''s Palace', 'The lattice in the palace windows is assembled from thousands of small wooden pieces. The pieces slot into each other, with coloured glass set between them.

No nails and no glue are used. Everything is held together only by the tightness of precisely cut wood.

When the sun hits, the coloured glass paints patterns on the walls of the room. Lattice masters still carry on this craft in Sheki today.', '2026-10-17T14:30:00.000Z', true),
  (6, 'c86400aa-5c34-c719-255a-dd557b6f01e9', 'git', 'git switch - goes back to the previous branch', 'It works like `cd -`. When you jump between two branches often, you don''t have to type the name every time.

```sh
git switch feature/login
git switch main
git switch -   # back to feature/login
```

The older `git checkout -` does the same thing.', '2026-10-17T07:45:00.000Z', true),
  (7, '5069441e-414f-9475-7cf0-6ee20cb799d0', 'typescript', 'as const turns an array into a readonly tuple', 'When you write `["sm", "md", "lg"] as const`, the type is `readonly ["sm", "md", "lg"]`, not `string[]`. You can derive a union type straight from it.

```ts
const SIZES = ["sm", "md", "lg"] as const;

type Size = (typeof SIZES)[number]; // "sm" | "md" | "lg"
```

The list stays in one place, both for when you need it at runtime (to show in a menu, say) and as a type.', '2026-10-14T16:00:00.000Z', true),
  (8, '2adc4b70-4dcf-da24-7958-02840bef95ae', 'coffee', 'Brewing coffee with water just off the boil', 'After the water boils I wait 30–60 seconds. 92–96 °C is enough for brewing.

Boiling water also pulls the bitter compounds out of the coffee quickly, and the taste turns harsh. With slightly cooled water the acidity and sweetness come through more clearly.', '2026-10-13T05:00:00.000Z', true),
  (9, '1d1f6675-db20-ab9b-9f66-3e662e65d7cc', 'typescript', 'Check every case in a switch with never', 'In the `default` branch, assign the value to the `never` type. When you add a new case to the union, the compiler points out the place you forgot.

```ts
type Status = "draft" | "published";

function label(s: Status) {
  switch (s) {
    case "draft": return "Draft";
    case "published": return "Published";
    default: {
      const never: never = s; // an error appears here if a new case is added
      return never;
    }
  }
}
```', '2026-10-11T12:20:00.000Z', true),
  (10, '2adc4b70-4dcf-da24-7958-02840bef95ae', 'history', 'The Baku metro opened in 1967', 'The Baku metro opened on 6 November 1967. At the time it was the fifth metro in the Soviet Union.

The first line ran between the "Baku Soviet" station (today "Icherisheher") and the "Nariman Narimanov" station.', '2026-10-05T08:00:00.000Z', true);

insert into public.post_tags (post_id, tag) values
  (1, 'types'),
  (1, 'config'),
  (2, 'pilaf'),
  (2, 'rice'),
  (3, 'destructuring'),
  (4, 'types'),
  (5, 'sheki'),
  (5, 'architecture'),
  (6, 'terminal'),
  (7, 'types'),
  (7, 'arrays'),
  (8, 'coffee'),
  (9, 'types'),
  (9, 'union'),
  (10, 'baku'),
  (10, 'metro');

insert into public.reactions (post_id, user_id, kind) values
  (1, '2adc4b70-4dcf-da24-7958-02840bef95ae', 'learned'),
  (3, '2adc4b70-4dcf-da24-7958-02840bef95ae', 'surprised');

select setval(pg_get_serial_sequence('public.posts', 'id'), (select max(id) from public.posts));
