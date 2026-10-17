// Sample content for building the UI before Supabase is connected.
// Shapes mirror the tables in supabase/migrations/0001_schema.sql. Dates are relative to "now"
// so the feed always opens on "Bu gün". Nothing here ships to the browser: it is only
// imported from "use server" functions.
import type { Locale, Provider, ReactionCounts, ReactionKind } from "../types";

export interface MockProfile {
  id: string;
  handle: string;
  name: string;
  provider: Provider;
  avatarUrl: string | null;
}

export interface MockTopic {
  slug: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
}

export interface MockPost {
  id: string;
  title: string;
  body: string;
  lang: Locale;
  authorHandle: string;
  topicSlug: string;
  tags: string[];
  publishedAt: string;
  /** Reactions from people other than the demo users. */
  baseReactions: ReactionCounts;
}

const BAKU_OFFSET = 4 * 60 * 60_000; // Baku is UTC+4 all year

/** A Baku wall-clock time `days` ago. Today's posts that would be in the future land a few minutes ago. */
function daysAgo(days: number, hour: number, minute = 0) {
  const now = Date.now();
  const baku = new Date(now + BAKU_OFFSET);
  const t = Date.UTC(baku.getUTCFullYear(), baku.getUTCMonth(), baku.getUTCDate() - days, hour, minute) - BAKU_OFFSET;
  const early = (24 * 60 - hour * 60 - minute) * 100; // keeps the same order, under 2.5 minutes ago
  return new Date(t > now ? now - early : t).toISOString();
}

export const profiles: MockProfile[] = [
  { id: "u-rauf", handle: "rauf-aliyev", name: "Rauf Əliyev", provider: "github", avatarUrl: null },
  { id: "u-aynur", handle: "aynur-hasanova", name: "Aynur Həsənova", provider: "google", avatarUrl: null },
  { id: "u-tural", handle: "tural-mammadov", name: "Tural Məmmədov", provider: "github", avatarUrl: null },
  { id: "u-narmin", handle: "narmin-qasimova", name: "Nərmin Qasımova", provider: "google", avatarUrl: null },
  { id: "u-kamran", handle: "kamran-rzayev", name: "Kamran Rzayev", provider: "github", avatarUrl: null },
  { id: "u-leyla", handle: "leyla-cafarova", name: "Leyla Cəfərova", provider: "github", avatarUrl: null },
  // The account you sign in as in demo mode.
  { id: "u-sebine", handle: "sebine-q", name: "Səbinə Quliyeva", provider: "github", avatarUrl: null },
];

export const DEMO_USER_HANDLE = "sebine-q";

export const topics: MockTopic[] = [
  {
    slug: "typescript",
    name: { az: "TypeScript", en: "TypeScript" },
    description: {
      az: "Tiplər, kompilyator və gündəlik işdə kömək edən kiçik hiylələr.",
      en: "Types, the compiler and small tricks that help day to day.",
    },
  },
  {
    slug: "javascript",
    name: { az: "JavaScript", en: "JavaScript" },
    description: { az: "Dilin özü, brauzer və Node haqqında kiçik kəşflər.", en: "Small finds about the language, the browser and Node." },
  },
  {
    slug: "git",
    name: { az: "Git", en: "Git" },
    description: { az: "Terminalda vaxta qənaət edən əmrlər.", en: "Commands that save time in the terminal." },
  },
  {
    slug: "metbex",
    name: { az: "Mətbəx", en: "Cooking" },
    description: { az: "Yemək, dəm və dadın arxasındakı səbəblər.", en: "Food, brewing and the reasons behind the taste." },
  },
  {
    slug: "tarix",
    name: { az: "Tarix", en: "History" },
    description: { az: "Bakıdan Şəkiyə, yerlərin və əşyaların hekayəsi.", en: "From Baku to Sheki, the stories of places and things." },
  },
];

export const posts: MockPost[] = [
  {
    id: "1",
    title: "satisfies obyekti yoxlayır, amma dəqiq tipini saxlayır",
    lang: "az",
    authorHandle: "rauf-aliyev",
    topicSlug: "typescript",
    tags: ["tiplər", "konfiqurasiya"],
    publishedAt: daysAgo(0, 9, 40),
    baseReactions: { learned: 11, like: 4, thanks: 2 },
    body: `Uzun müddət obyektə tip vermək üçün \`const routes: Record<string, Route>\` yazırdım. İşləyir, amma bir problemi var: bundan sonra TypeScript obyektin konkret açarlarını unudur.

Yəni \`routes.blog\` yazsam belə, xəta çıxmır. Tip deyir ki, istənilən sətir açar ola bilər.

\`satisfies\` bunu düzəldir. Obyektin tipə uyğun olduğunu yoxlayır, amma öz dəqiq tipini saxlayır:

\`\`\`ts
type Route = { path: string; auth?: boolean };

const routes = {
  home: { path: "/" },
  admin: { path: "/admin", auth: true },
} satisfies Record<string, Route>;

routes.admin.auth; // boolean
routes.blog;       // xəta: belə açar yoxdur
\`\`\`

## Nə vaxt işlədim?

Konfiqurasiya obyektlərində, marşrut cədvəllərində, rəng palitralarında. Yəni həm formanın yoxlanması, həm də dəqiq açarlar lazım olan yerdə.

\`satisfies\` TypeScript 4.9-dan bəri var. Ətraflı: [buraxılış qeydləri](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html).`,
  },
  {
    id: "2",
    title: "Plov üçün düyünü niyə duzlu suda isladırlar",
    lang: "az",
    authorHandle: "aynur-hasanova",
    topicSlug: "metbex",
    tags: ["plov", "düyü"],
    publishedAt: daysAgo(0, 8, 15),
    baseReactions: { learned: 8, love: 5, surprised: 1 },
    body: `Düyünü bir neçə saat ılıq duzlu suda saxlayırlar. Dənələr suyu bərabər çəkir, dəmdə bişəndə bütöv və ayrı-ayrı qalır.

Duz həm dadı içəridən verir, həm də dənənin üzünü bir az bərkidir. Ona görə qaynayan suya atanda düyü tez yumşalıb dağılmır.

Sonra düyünü süzüb qısa müddət qaynadırlar, yarıbişmiş halda yenidən süzürlər və dəmə qoyurlar.`,
  },
  {
    id: "3",
    title: "Destrukturizasiyada standart dəyər null üçün işləmir",
    lang: "az",
    authorHandle: "tural-mammadov",
    topicSlug: "javascript",
    tags: ["destrukturizasiya"],
    publishedAt: daysAgo(0, 7, 5),
    baseReactions: { learned: 6, surprised: 2 },
    body: `\`const { size = 10 } = opts\` yazanda \`size\` yalnız \`undefined\` olanda 10 olur. Serverdən \`null\` gəlsə, \`null\` qalır.

\`\`\`js
const { size = 10 } = { size: null };
size; // null, 10 yox

const safe = opts.size ?? 10;
\`\`\`

\`??\` həm \`null\`, həm də \`undefined\` üçün işləyir. API cavablarında standart dəyər lazımdırsa, onu seçmək daha etibarlıdır.`,
  },
  {
    id: "4",
    title: "keyof typeof ilə obyektdən union",
    lang: "az",
    authorHandle: "sebine-q",
    topicSlug: "typescript",
    tags: ["tiplər"],
    publishedAt: daysAgo(1, 21, 10),
    baseReactions: { learned: 2, like: 1 },
    body: `Rəng adlarını bir obyektdə saxlayıram və tip üçün eyni siyahını ikinci dəfə yazmaq istəmirəm.

\`\`\`ts
const COLORS = { red: "#b42318", blue: "#2547a8" };

type Color = keyof typeof COLORS; // "red" | "blue"
\`\`\`

\`typeof\` dəyərdən tip götürür, \`keyof\` isə həmin tipin açarlarını union kimi verir. Obyektə yeni rəng əlavə edəndə tip özü yenilənir.`,
  },
  {
    id: "5",
    title: "Şəki Xan sarayının şəbəkələrində bir dənə də mismar yoxdur",
    lang: "az",
    authorHandle: "narmin-qasimova",
    topicSlug: "tarix",
    tags: ["şəki", "memarlıq"],
    publishedAt: daysAgo(1, 18, 30),
    baseReactions: { learned: 21, love: 9, surprised: 7 },
    body: `Sarayın pəncərələrindəki şəbəkə minlərlə kiçik taxta hissədən yığılıb. Hissələr bir-birinə geydirilir, aralarına rəngli şüşə qoyulur.

Nə mismar işlədilib, nə yapışqan. Hər şey yalnız dəqiq kəsilmiş taxtanın sıxlığı ilə tutulur.

Günəş düşəndə rəngli şüşələr otağın divarlarına naxış salır. Şəbəkə ustaları bu sənəti bu gün də Şəkidə davam etdirirlər.`,
  },
  {
    id: "6",
    title: "git switch - əvvəlki branch-a qaytarır",
    lang: "az",
    authorHandle: "kamran-rzayev",
    topicSlug: "git",
    tags: ["terminal"],
    publishedAt: daysAgo(1, 11, 45),
    baseReactions: { learned: 14, like: 6 },
    body: `\`cd -\` kimi işləyir. İki branch arasında tez-tez keçəndə adını hər dəfə yazmağa ehtiyac qalmır.

\`\`\`sh
git switch feature/login
git switch main
git switch -   # yenidən feature/login
\`\`\`

Köhnə \`git checkout -\` də eyni işi görür.`,
  },
  {
    id: "7",
    title: "as const massivi oxumaq üçün tuple edir",
    lang: "az",
    authorHandle: "rauf-aliyev",
    topicSlug: "typescript",
    tags: ["tiplər", "massiv"],
    publishedAt: daysAgo(4, 20, 0),
    baseReactions: { learned: 7, like: 3 },
    body: `\`["az", "en"] as const\` yazanda tip \`string[]\` yox, \`readonly ["az", "en"]\` olur. Ondan birbaşa union tip çıxarmaq olar.

\`\`\`ts
const LANGS = ["az", "en"] as const;

type Lang = (typeof LANGS)[number]; // "az" | "en"
\`\`\`

Siyahı həm iş vaxtında lazım olanda (məsələn, menyuda göstərmək üçün), həm də tip kimi, bir yerdə qalır.`,
  },
  {
    id: "8",
    title: "Qəhvəni qaynayan su ilə dəmləmə",
    lang: "az",
    authorHandle: "sebine-q",
    topicSlug: "metbex",
    tags: ["qəhvə"],
    publishedAt: daysAgo(5, 9, 0),
    baseReactions: { learned: 9, like: 3, thanks: 2 },
    body: `Su qaynayandan sonra 30–60 saniyə gözləyirəm. Dəmləmə üçün 92–96 °C kifayətdir.

Qaynar su qəhvədən acı maddələri də tez çıxarır və dad kəskinləşir. Bir az soyumuş su ilə turşuluq və şirinlik daha aydın hiss olunur.`,
  },
  {
    id: "9",
    title: "switch-də never ilə hər halı yoxlamaq",
    lang: "az",
    authorHandle: "leyla-cafarova",
    topicSlug: "typescript",
    tags: ["tiplər", "union"],
    publishedAt: daysAgo(7, 16, 20),
    baseReactions: { learned: 9, surprised: 2 },
    body: `\`default\` budağında dəyəri \`never\` tipinə mənimsət. Union-a yeni hal əlavə edəndə kompilyator unutduğun yeri özü göstərir.

\`\`\`ts
type Status = "draft" | "published";

function label(s: Status) {
  switch (s) {
    case "draft": return "Qaralama";
    case "published": return "Dərc olunub";
    default: {
      const never: never = s; // yeni hal əlavə olunsa, burada xəta çıxır
      return never;
    }
  }
}
\`\`\``,
  },
  {
    id: "10",
    title: "Bakı metrosu 1967-ci ildə açılıb",
    lang: "az",
    authorHandle: "sebine-q",
    topicSlug: "tarix",
    tags: ["bakı", "metro"],
    publishedAt: daysAgo(13, 12, 0),
    baseReactions: { learned: 25, love: 6, surprised: 6 },
    body: `Bakı metrosu 6 noyabr 1967-ci ildə açılıb. O vaxt Sovet İttifaqında beşinci metro idi.

İlk xətt "Bakı Soveti" (indiki "İçərişəhər") ilə "Nəriman Nərimanov" stansiyaları arasında idi.`,
  },
];

/** Demo users' own reactions: handle → post id → kind. */
export const seedUserReactions: Record<string, Record<string, ReactionKind>> = {
  "sebine-q": { "1": "learned", "3": "surprised" },
};
