"use client";

import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  LogOut,
  MessageSquareText,
  Plus,
  Rocket,
  Save,
  Scale,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

type View =
  | "dashboard"
  | "companies"
  | "forum"
  | "checklist"
  | "calendar"
  | "drafts"
  | "practice"
  | "obVisits"
  | "compare"
  | "analytics"
  | "weekly"
  | "launch";

type Status = "preparing" | "applied" | "document" | "firstInterview" | "finalInterview" | "offer" | "rejected";
type Priority = "high" | "medium" | "low";
type AnswerType = "motivation" | "selfPr" | "gakuchika";
type DraftStatus = "draft" | "review" | "done";

type UserProfile = {
  name: string;
  email: string;
  plan: "free" | "paid";
  aiUsed: number;
  aiLimit: number;
};

type Task = {
  id: string;
  label: string;
  dueDate: string;
  done: boolean;
};

type Company = {
  id: string;
  name: string;
  industry: string;
  jobType: string;
  status: Status;
  priority: Priority;
  nextInterview: string;
  esDeadline: string;
  entryDeadline: string;
  memo: string;
  answers: Record<AnswerType, string>;
  tasks: Task[];
};

type ForumAnswer = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

type ForumPost = {
  id: string;
  companyName: string;
  phase: string;
  title: string;
  body: string;
  createdAt: string;
  answers: ForumAnswer[];
};

type ChecklistItem = {
  id: string;
  category: string;
  label: string;
  done: boolean;
};

type Draft = {
  id: string;
  companyName: string;
  type: AnswerType;
  title: string;
  body: string;
  status: DraftStatus;
  updatedAt: string;
};

type PracticeMessage = {
  id: string;
  role: "ai" | "user";
  body: string;
};

type PracticeSession = {
  id: string;
  companyName: string;
  theme: string;
  messages: PracticeMessage[];
};

type InterviewNote = {
  id: string;
  companyName: string;
  interviewDate: string;
  questions: string;
  answered: string;
  stuck: string;
  reaction: string;
  reflection: string;
  nextActions: string;
  result: string;
};

type ObVisit = {
  id: string;
  companyName: string;
  personName: string;
  role: string;
  visitDate: string;
  questions: string;
  insights: string;
  followUp: string;
};

type CompareItem = {
  id: string;
  companyName: string;
  salary: string;
  workStyle: string;
  techStack: string;
  culture: string;
  growth: string;
  score: number;
};

type WeeklyReport = {
  id: string;
  weekOf: string;
  wins: string;
  blockers: string;
  nextFocus: string;
  summary: string;
};

type CountItem = {
  label: string;
  count: number;
};

const storagePrefix = "jobstock:v2:";

const statusLabels: Record<Status, string> = {
  preparing: "準備中",
  applied: "応募済み",
  document: "書類選考",
  firstInterview: "一次面接",
  finalInterview: "最終面接",
  offer: "内定",
  rejected: "終了",
};

const priorityLabels: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const answerLabels: Record<AnswerType, string> = {
  motivation: "志望動機",
  selfPr: "自己PR",
  gakuchika: "ガクチカ",
};

const statusOptions = Object.entries(statusLabels) as Array<[Status, string]>;
const priorityOptions = Object.entries(priorityLabels) as Array<[Priority, string]>;
const answerOptions = Object.entries(answerLabels) as Array<[AnswerType, string]>;

const checklistSeed: ChecklistItem[] = [
  { id: "c1", category: "面接前", label: "企業の事業内容と競合を確認する", done: false },
  { id: "c2", category: "面接前", label: "志望動機を1分で話せる形にする", done: false },
  { id: "c3", category: "面接前", label: "開発経験の担当範囲、工夫、成果を整理する", done: false },
  { id: "c4", category: "面接中", label: "結論、経験、学びの順で話す", done: false },
  { id: "c5", category: "面接中", label: "技術名だけでなく課題と判断理由を伝える", done: false },
  { id: "c6", category: "面接後", label: "聞かれた質問、詰まった質問、面接官の反応を残す", done: false },
  { id: "c7", category: "面接後", label: "次回までの改善点を1つ決める", done: false },
];

const companySeed: Company[] = [
  {
    id: "co-1",
    name: "ミライシステムズ",
    industry: "SIer",
    jobType: "Webエンジニア",
    status: "firstInterview",
    priority: "high",
    nextInterview: "",
    esDeadline: "",
    entryDeadline: "",
    memo: "業務改善案件が多い。チーム開発経験と課題解決を強めに話す。",
    answers: {
      motivation: "専門学校で学んだWeb開発を活かし、業務課題をシステムで解決できるエンジニアになりたいです。",
      selfPr: "私の強みは、課題を分解して改善を続けられることです。チーム開発では画面表示の遅さを計測し、API呼び出しを減らして改善しました。",
      gakuchika: "チーム制作で、担当外の不具合にもログを見ながら原因を整理し、メンバーと相談して改善しました。",
    },
    tasks: [
      { id: "task-1", label: "一次面接の想定質問を準備", dueDate: "", done: false },
      { id: "task-2", label: "逆質問を3つ作る", dueDate: "", done: false },
    ],
  },
  {
    id: "co-2",
    name: "コードキャンバス",
    industry: "Webサービス",
    jobType: "フロントエンドエンジニア",
    status: "document",
    priority: "medium",
    nextInterview: "",
    esDeadline: "",
    entryDeadline: "",
    memo: "ユーザー視点とUI改善の経験を中心に整理する。",
    answers: { motivation: "", selfPr: "", gakuchika: "" },
    tasks: [],
  },
];

const forumSeed: ForumPost[] = [
  {
    id: "post-1",
    companyName: "ミライシステムズ",
    phase: "一次面接",
    title: "一次面接で聞かれたこと",
    body: "開発経験についてどのくらい深掘りされましたか？",
    createdAt: new Date().toISOString(),
    answers: [
      {
        id: "ans-1",
        author: "先輩ユーザー",
        body: "担当範囲、苦労した点、なぜその技術を選んだかを聞かれました。成果だけでなく判断理由を話せると強いです。",
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

const draftsSeed: Draft[] = [
  {
    id: "draft-1",
    companyName: "コードキャンバス",
    type: "motivation",
    title: "Webサービス向け志望動機",
    body: "ユーザーに近い立場で改善を続けられる開発に携わりたいです。",
    status: "draft",
    updatedAt: new Date().toISOString(),
  },
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(`${storagePrefix}${key}`);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value));
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setValue(readStorage(key, fallback));
    setLoaded(true);
  }, [key]);

  function update(next: T) {
    setValue(next);
    writeStorage(key, next);
  }

  return [value, update, loaded] as const;
}

function countBy<T>(items: T[], labeler: (item: T) => string): CountItem[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const label = labeler(item).trim() || "未設定";
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function statusRank(status: Status) {
  const rank: Record<Status, number> = { preparing: 0, applied: 1, document: 2, firstInterview: 3, finalInterview: 4, offer: 5, rejected: 1 };
  return rank[status];
}

function formatDate(value: string) {
  if (!value) return "未定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未定";
  return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(date);
}

function getSupabaseStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? "Realtime準備OK" : "ローカルMVP";
}

function localDeepQuestions(company: Company) {
  return [
    `${company.name}でなぜ${company.jobType}を志望しているのですか？`,
    "その開発で一番苦労した点は何ですか？",
    "技術選定で比較した選択肢はありましたか？",
    "チーム内でのあなたの役割は何でしたか？",
    "失敗したことと、改善した方法を教えてください。",
  ].join("\n");
}

function localPortfolioPitch(company: Company) {
  return `${company.name}向けには、制作物を「課題、担当、工夫、成果」の順で説明すると伝わりやすいです。\n\n例: 私はチーム開発で、画面表示が遅いという課題に対して、ログと計測を使って原因を分け、API呼び出しを減らす改善を担当しました。結果として操作感が改善し、課題を分解して解決する力を身につけました。`;
}

export default function JobStockApp() {
  const [user, setUser, userLoaded] = useStoredState<UserProfile | null>("user", null);
  const [companies, setCompanies] = useStoredState<Company[]>("companies", companySeed);
  const [forumPosts, setForumPosts] = useStoredState<ForumPost[]>("forum", forumSeed);
  const [checklist, setChecklist] = useStoredState<ChecklistItem[]>("checklist", checklistSeed);
  const [drafts, setDrafts] = useStoredState<Draft[]>("drafts", draftsSeed);
  const [notes, setNotes] = useStoredState<InterviewNote[]>("notes", []);
  const [practiceSessions, setPracticeSessions] = useStoredState<PracticeSession[]>("practice", []);
  const [obVisits, setObVisits] = useStoredState<ObVisit[]>("ob-visits", []);
  const [compareItems, setCompareItems] = useStoredState<CompareItem[]>("compare", []);
  const [weeklyReports, setWeeklyReports] = useStoredState<WeeklyReport[]>("weekly", []);
  const [view, setView] = useState<View>("dashboard");
  const [selectedCompanyId, setSelectedCompanyId] = useState(companySeed[0].id);
  const [activeAnswer, setActiveAnswer] = useState<AnswerType>("motivation");
  const [aiResult, setAiResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? companies[0];

  useEffect(() => {
    if (!companies.some((company) => company.id === selectedCompanyId)) {
      setSelectedCompanyId(companies[0]?.id ?? "");
    }
  }, [companies, selectedCompanyId]);

  function updateCompanies(next: Company[]) {
    setCompanies(next);
  }

  function updateCompany(id: string, updater: (company: Company) => Company) {
    updateCompanies(companies.map((company) => (company.id === id ? updater(company) : company)));
  }

  function addCompany() {
    const next: Company = {
      id: createId("company"),
      name: "新しい企業",
      industry: "IT",
      jobType: "Webエンジニア",
      status: "preparing",
      priority: "medium",
      nextInterview: "",
      esDeadline: "",
      entryDeadline: "",
      memo: "",
      answers: { motivation: "", selfPr: "", gakuchika: "" },
      tasks: [],
    };
    updateCompanies([next, ...companies]);
    setSelectedCompanyId(next.id);
    setView("companies");
  }

  async function generateAi(kind: "rewrite" | "questions" | "portfolio" | "feedback") {
    if (!selectedCompany) return;
    if (kind === "questions") {
      setAiResult(localDeepQuestions(selectedCompany));
      return;
    }
    if (kind === "portfolio") {
      setAiResult(localPortfolioPitch(selectedCompany));
      return;
    }
    if (kind === "feedback") {
      const recentNote = notes.find((note) => note.companyName === selectedCompany.name);
      setAiResult(
        recentNote
          ? `次回は「${recentNote.stuck || "詰まった質問"}」に対して、結論、理由、具体例の順で30秒回答を作ると良さそうです。面接官の反応は「${recentNote.reaction || "未記録"}」なので、伝わりにくかった点を1つだけ直しましょう。`
          : "面接メモがまだありません。聞かれた質問、詰まった質問、面接官の反応を残すと、次回の改善点を作れます。",
      );
      return;
    }

    const text = selectedCompany.answers[activeAnswer].trim();
    if (!text) {
      setAiResult("先に回答本文を入力してください。");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mode: "interview",
          answerType: activeAnswer,
          companyName: selectedCompany.name,
          industry: selectedCompany.industry,
          jobType: selectedCompany.jobType,
        }),
      });
      const data = (await response.json()) as { result?: string; error?: string };
      setAiResult(data.result ?? data.error ?? "AI変換に失敗しました。");
      if (user) setUser({ ...user, aiUsed: user.aiUsed + 1 });
    } finally {
      setIsGenerating(false);
    }
  }

  if (!userLoaded) return <LoadingScreen />;
  if (!user) return <LoginScreen onLogin={setUser} />;

  const navGroups: Array<{ title: string; items: Array<{ view: View; label: string; icon: ReactNode }> }> = [
    {
      title: "基本",
      items: [
        { view: "dashboard", label: "ダッシュボード", icon: <ClipboardList size={18} /> },
        { view: "companies", label: "企業管理", icon: <BriefcaseBusiness size={18} /> },
        { view: "forum", label: "企業別Q&A", icon: <MessageSquareText size={18} /> },
      ],
    },
    {
      title: "準備",
      items: [
        { view: "checklist", label: "チェックリスト", icon: <Check size={18} /> },
        { view: "calendar", label: "カレンダー", icon: <CalendarDays size={18} /> },
        { view: "drafts", label: "ES下書き", icon: <FileText size={18} /> },
        { view: "practice", label: "面接練習", icon: <Bot size={18} /> },
      ],
    },
    {
      title: "記録・分析",
      items: [
        { view: "obVisits", label: "OB/OGメモ", icon: <Users size={18} /> },
        { view: "compare", label: "企業比較", icon: <Scale size={18} /> },
        { view: "analytics", label: "通過率分析", icon: <TrendingUp size={18} /> },
        { view: "weekly", label: "週次レポート", icon: <BarChart3 size={18} /> },
        { view: "launch", label: "公開準備", icon: <Rocket size={18} /> },
      ],
    },
  ];

  return (
    <main className="appShell">
      <aside className="sidebar" aria-label="メニュー">
        <div className="brandBlock">
          <div className="brandMark">JS</div>
          <div>
            <p className="eyebrow">JobStock AI</p>
            <h1>就活ノート</h1>
          </div>
        </div>

        <nav className="navList">
          {navGroups.map((group) => (
            <div className="navGroup" key={group.title}>
              <p className="eyebrow">{group.title}</p>
              {group.items.map((item) => (
                <button key={item.view} className={view === item.view ? "navButton active" : "navButton"} onClick={() => setView(item.view)}>
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="planBox">
          <div>
            <span className="tag">{getSupabaseStatus()}</span>
            <p>AI {user.aiUsed} / {user.aiLimit} 回</p>
          </div>
          <button className="iconButton" title="ログアウト" onClick={() => setUser(null)}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}</p>
            <h2>{user.name}さんの就活ストック</h2>
          </div>
          <button className="primaryButton" onClick={addCompany}>
            <Plus size={18} />
            企業を追加
          </button>
        </header>

        {view === "dashboard" && <Dashboard companies={companies} checklist={checklist} forumPosts={forumPosts} onOpenView={setView} />}
        {view === "companies" && selectedCompany && (
          <CompanyWorkspace
            company={selectedCompany}
            companies={companies}
            activeAnswer={activeAnswer}
            aiResult={aiResult}
            isGenerating={isGenerating}
            onSelectCompany={setSelectedCompanyId}
            onActiveAnswer={setActiveAnswer}
            onUpdateCompany={updateCompany}
            onGenerateAi={generateAi}
          />
        )}
        {view === "forum" && <ForumWorkspace posts={forumPosts} companies={companies} userName={user.name} onChange={setForumPosts} />}
        {view === "checklist" && <ChecklistWorkspace items={checklist} onChange={setChecklist} />}
        {view === "calendar" && <CalendarWorkspace companies={companies} notes={notes} />}
        {view === "drafts" && <DraftWorkspace drafts={drafts} companies={companies} onChange={setDrafts} />}
        {view === "practice" && <PracticeWorkspace companies={companies} sessions={practiceSessions} onChange={setPracticeSessions} />}
        {view === "obVisits" && <ObVisitWorkspace visits={obVisits} companies={companies} onChange={setObVisits} />}
        {view === "compare" && <CompareWorkspace items={compareItems} companies={companies} onChange={setCompareItems} />}
        {view === "analytics" && <AnalyticsWorkspace companies={companies} drafts={drafts} notes={notes} />}
        {view === "weekly" && <WeeklyWorkspace reports={weeklyReports} companies={companies} drafts={drafts} notes={notes} onChange={setWeeklyReports} />}
        {view === "launch" && <LaunchWorkspace />}
      </section>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="loginShell">
      <section className="loginPanel">
        <div className="brandBlock loginBrand">
          <div className="brandMark">JS</div>
          <div>
            <p className="eyebrow">JobStock AI</p>
            <h1>読み込み中</h1>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: UserProfile) => void }) {
  const [name, setName] = useState("kirua");
  const [email, setEmail] = useState("kirua@example.com");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin({ name: name.trim() || "ユーザー", email, plan: "free", aiUsed: 0, aiLimit: 20 });
  }

  return (
    <main className="loginShell">
      <form className="loginPanel" onSubmit={submit}>
        <div className="brandBlock loginBrand">
          <div className="brandMark">JS</div>
          <div>
            <p className="eyebrow">JobStock AI</p>
            <h1>就活回答を企業ごとに育てる</h1>
          </div>
        </div>
        <label>名前<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>メール<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <button className="primaryButton fullButton" type="submit">デモログイン</button>
      </form>
    </main>
  );
}

function Dashboard({ companies, checklist, forumPosts, onOpenView }: { companies: Company[]; checklist: ChecklistItem[]; forumPosts: ForumPost[]; onOpenView: (view: View) => void }) {
  const interviews = companies.filter((company) => company.nextInterview).length;
  const unfinished = companies.reduce((sum, company) => sum + Object.values(company.answers).filter((answer) => !answer.trim()).length, 0);
  const checklistDone = checklist.filter((item) => item.done).length;

  return (
    <div className="contentStack">
      <section className="metricGrid">
        <Metric icon={<BriefcaseBusiness size={20} />} label="登録企業" value={`${companies.length}社`} />
        <Metric icon={<CalendarDays size={20} />} label="面接予定" value={`${interviews}件`} />
        <Metric icon={<FileText size={20} />} label="未完成回答" value={`${unfinished}件`} />
        <Metric icon={<Check size={20} />} label="完了チェック" value={`${checklistDone}件`} />
      </section>

      <DashboardCharts companies={companies} />

      <section className="quickActionGrid">
        <button className="quickAction" onClick={() => onOpenView("forum")}><MessageSquareText size={18} /><span>企業別Q&A</span></button>
        <button className="quickAction" onClick={() => onOpenView("practice")}><Bot size={18} /><span>面接練習</span></button>
        <button className="quickAction" onClick={() => onOpenView("analytics")}><TrendingUp size={18} /><span>通過率分析</span></button>
        <button className="quickAction" onClick={() => onOpenView("launch")}><Rocket size={18} /><span>公開準備</span></button>
      </section>

      <section className="companyGrid">
        {companies.map((company) => (
          <article className="companyCard" key={company.id}>
            <span className={`priority priority-${company.priority}`}>志望度 {priorityLabels[company.priority]}</span>
            <h4>{company.name}</h4>
            <p>{company.industry} / {company.jobType}</p>
            <div className="cardMeta">
              <span>{statusLabels[company.status]}</span>
              <span>面接 {formatDate(company.nextInterview)}</span>
              <span>ES {formatDate(company.esDeadline)}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="surface">
        <div className="sectionHeader compact"><div><p className="eyebrow">Community</p><h3>最近のQ&A</h3></div><span className="tag">{forumPosts.length}件</span></div>
        <div className="noteList">
          {forumPosts.slice(0, 2).map((post) => <article className="noteCard" key={post.id}><span className="tag">{post.companyName}</span><h4>{post.title}</h4><p>{post.body}</p></article>)}
        </div>
      </section>
    </div>
  );
}

function DashboardCharts({ companies }: { companies: Company[] }) {
  const industryCounts = countBy(companies, (company) => company.industry);
  const maxIndustry = Math.max(1, ...industryCounts.map((item) => item.count));
  const total = Math.max(1, companies.length);
  const statusCounts = statusOptions.map(([status, label]) => ({ status, label, count: companies.filter((company) => company.status === status).length }));

  return (
    <section className="chartGrid">
      <div className="surface chartPanel">
        <div className="sectionHeader compact"><div><p className="eyebrow">Industry</p><h3>志望業界ごとの応募数</h3></div></div>
        <div className="barList">
          {industryCounts.map((item) => <BarRow key={item.label} label={item.label} count={`${item.count}社`} percent={(item.count / maxIndustry) * 100} />)}
        </div>
      </div>
      <div className="surface chartPanel">
        <div className="sectionHeader compact"><div><p className="eyebrow">Status</p><h3>選考ステータスの割合</h3></div></div>
        <div className="stackedBar">
          {statusCounts.map((item) => item.count > 0 ? <span key={item.status} className={`statusSlice status-${item.status}`} style={{ width: `${(item.count / total) * 100}%` }} /> : null)}
        </div>
        <div className="legendGrid">
          {statusCounts.map((item) => <div className="legendItem" key={item.status}><span className={`legendDot status-${item.status}`} /><span>{item.label}</span><strong>{Math.round((item.count / total) * 100)}%</strong></div>)}
        </div>
      </div>
    </section>
  );
}

function BarRow({ label, count, percent }: { label: string; count: string; percent: number }) {
  return <div className="barRow"><div className="barText"><span>{label}</span><strong>{count}</strong></div><div className="barTrack"><span style={{ width: `${Math.max(6, percent)}%` }} /></div></div>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="metricBox"><div className="metricIcon">{icon}</div><span>{label}</span><strong>{value}</strong></div>;
}

function CompanyWorkspace({ company, companies, activeAnswer, aiResult, isGenerating, onSelectCompany, onActiveAnswer, onUpdateCompany, onGenerateAi }: { company: Company; companies: Company[]; activeAnswer: AnswerType; aiResult: string; isGenerating: boolean; onSelectCompany: (id: string) => void; onActiveAnswer: (type: AnswerType) => void; onUpdateCompany: (id: string, updater: (company: Company) => Company) => void; onGenerateAi: (kind: "rewrite" | "questions" | "portfolio" | "feedback") => void }) {
  function setField<K extends keyof Company>(key: K, value: Company[K]) {
    onUpdateCompany(company.id, (current) => ({ ...current, [key]: value }));
  }

  function addTask() {
    onUpdateCompany(company.id, (current) => ({ ...current, tasks: [...current.tasks, { id: createId("task"), label: "新しいタスク", dueDate: "", done: false }] }));
  }

  return (
    <div className="splitLayout">
      <aside className="companyRail">
        {companies.map((item) => <button key={item.id} className={item.id === company.id ? "railItem active" : "railItem"} onClick={() => onSelectCompany(item.id)}><strong>{item.name}</strong><span>{statusLabels[item.status]}</span></button>)}
      </aside>
      <div className="contentStack">
        <section className="formGrid surface">
          <label>企業名<input value={company.name} onChange={(event) => setField("name", event.target.value)} /></label>
          <label>業界<input value={company.industry} onChange={(event) => setField("industry", event.target.value)} /></label>
          <label>志望職種<input value={company.jobType} onChange={(event) => setField("jobType", event.target.value)} /></label>
          <label>選考状況<select value={company.status} onChange={(event) => setField("status", event.target.value as Status)}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>志望度<select value={company.priority} onChange={(event) => setField("priority", event.target.value as Priority)}>{priorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>次回面接日<input type="date" value={company.nextInterview} onChange={(event) => setField("nextInterview", event.target.value)} /></label>
          <label>ES締切<input type="date" value={company.esDeadline} onChange={(event) => setField("esDeadline", event.target.value)} /></label>
          <label>応募締切<input type="date" value={company.entryDeadline} onChange={(event) => setField("entryDeadline", event.target.value)} /></label>
          <label className="wideField">企業メモ<textarea value={company.memo} onChange={(event) => setField("memo", event.target.value)} /></label>
        </section>

        <section className="surface">
          <div className="sectionHeader compact">
            <div><p className="eyebrow">Answers</p><h3>回答ストック</h3></div>
            <div className="segmented">{answerOptions.map(([value, label]) => <button key={value} className={activeAnswer === value ? "active" : ""} onClick={() => onActiveAnswer(value)}>{label}</button>)}</div>
          </div>
          <textarea className="mainTextarea" value={company.answers[activeAnswer]} onChange={(event) => onUpdateCompany(company.id, (current) => ({ ...current, answers: { ...current.answers, [activeAnswer]: event.target.value } }))} />
          <div className="actionRow">
            <button className="primaryButton" onClick={() => onGenerateAi("rewrite")} disabled={isGenerating}><Sparkles size={18} />面接用に変換</button>
            <button className="secondaryButton" onClick={() => onGenerateAi("questions")}><Target size={18} />深掘り質問</button>
            <button className="secondaryButton" onClick={() => onGenerateAi("portfolio")}><FileText size={18} />ポートフォリオ説明</button>
            <button className="secondaryButton" onClick={() => onGenerateAi("feedback")}><TrendingUp size={18} />面接後フィードバック</button>
          </div>
          {aiResult && <div className="aiSavedBox"><span>AIサポート</span><p>{aiResult}</p></div>}
        </section>

        <section className="surface">
          <div className="sectionHeader compact"><div><p className="eyebrow">Tasks</p><h3>企業ごとのやること</h3></div><button className="secondaryButton" onClick={addTask}><Plus size={18} />追加</button></div>
          <div className="savedQuestions">
            {company.tasks.map((task) => <label key={task.id} className="checkRow"><input type="checkbox" checked={task.done} onChange={(event) => onUpdateCompany(company.id, (current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, done: event.target.checked } : item) }))} /><span>{task.label} {task.dueDate && ` / ${formatDate(task.dueDate)}`}</span></label>)}
          </div>
        </section>
      </div>
    </div>
  );
}

function ForumWorkspace({ posts, companies, userName, onChange }: { posts: ForumPost[]; companies: Company[]; userName: string; onChange: (posts: ForumPost[]) => void }) {
  const [form, setForm] = useState({ companyName: companies[0]?.name ?? "", phase: "一次面接", title: "", body: "" });
  const [search, setSearch] = useState("");
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const filtered = posts.filter((post) => `${post.companyName} ${post.phase} ${post.title}`.includes(search));

  function addPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    onChange([{ id: createId("post"), ...form, createdAt: new Date().toISOString(), answers: [] }, ...posts]);
    setForm({ ...form, title: "", body: "" });
  }

  function addAnswer(postId: string) {
    const body = answerText[postId]?.trim();
    if (!body) return;
    onChange(posts.map((post) => post.id === postId ? { ...post, answers: [...post.answers, { id: createId("answer"), author: userName, body, createdAt: new Date().toISOString() }] } : post));
    setAnswerText({ ...answerText, [postId]: "" });
  }

  return (
    <div className="splitLayout reverseOnSmall">
      <section className="surface">
        <div className="sectionHeader compact"><div><p className="eyebrow">Community</p><h3>企業別Q&A掲示板</h3></div><span className="tag">{getSupabaseStatus()}</span></div>
        <form className="contentStack" onSubmit={addPost}>
          <label>企業<select value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })}>{companies.map((company) => <option key={company.id} value={company.name}>{company.name}</option>)}</select></label>
          <label>フェーズ<select value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })}><option>ES</option><option>一次面接</option><option>二次面接</option><option>最終面接</option><option>逆質問</option></select></label>
          <label>タイトル<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>質問<textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label>
          <button className="primaryButton" type="submit"><Send size={18} />投稿する</button>
        </form>
      </section>
      <section className="contentStack">
        <div className="surface"><label>企業名・フェーズで検索<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="例: ミライ 一次" /></label></div>
        {filtered.map((post) => <article className="surface boardPost" key={post.id}><div className="companyCardTop"><div><span className="tag">{post.companyName} / {post.phase}</span><h4>{post.title}</h4></div><span className="answerCount">{post.answers.length}件</span></div><p className="boardQuestion">{post.body}</p><div className="answerList">{post.answers.map((answer) => <div className="answerBubble" key={answer.id}><strong>{answer.author}</strong><p>{answer.body}</p></div>)}</div><div className="chatComposer"><input value={answerText[post.id] ?? ""} onChange={(event) => setAnswerText({ ...answerText, [post.id]: event.target.value })} placeholder="回答を書く" /><button className="iconButton" title="送信" onClick={() => addAnswer(post.id)}><Send size={18} /></button></div></article>)}
      </section>
    </div>
  );
}

function ChecklistWorkspace({ items, onChange }: { items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void }) {
  const progress = Math.round((items.filter((item) => item.done).length / Math.max(1, items.length)) * 100);
  const groups = countBy(items, (item) => item.category).map((group) => ({ ...group, items: items.filter((item) => item.category === group.label) }));

  return <div className="contentStack"><section className="surface"><div className="sectionHeader compact"><div><p className="eyebrow">Checklist</p><h3>面接対策チェックリスト</h3></div><strong className="progressNumber">{progress}%</strong></div><div className="barTrack largeTrack"><span style={{ width: `${progress}%` }} /></div></section><section className="featureGrid">{groups.map((group) => <div className="surface" key={group.label}><h4>{group.label}</h4><div className="savedQuestions">{group.items.map((item) => <label className="checkRow" key={item.id}><input type="checkbox" checked={item.done} onChange={(event) => onChange(items.map((current) => current.id === item.id ? { ...current, done: event.target.checked } : current))} /><span>{item.label}</span></label>)}</div></div>)}</section></div>;
}

function CalendarWorkspace({ companies, notes }: { companies: Company[]; notes: InterviewNote[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => index + 1);
  const blanks = Array.from({ length: new Date(year, month, 1).getDay() }, (_, index) => index);

  function eventsFor(dateKey: string) {
    return [
      ...companies.flatMap((company) => [
        company.nextInterview === dateKey ? `${company.name} 面接` : "",
        company.esDeadline === dateKey ? `${company.name} ES締切` : "",
        company.entryDeadline === dateKey ? `${company.name} 応募締切` : "",
      ]),
      ...notes.map((note) => (note.interviewDate === dateKey ? `${note.companyName} 面接メモ` : "")),
    ].filter(Boolean);
  }

  return <section className="surface"><div className="sectionHeader compact"><div><p className="eyebrow">Calendar</p><h3>{year}年{month + 1}月</h3></div></div><div className="calendarGrid calendarWeekdays">{["日", "月", "火", "水", "木", "金", "土"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendarGrid">{blanks.map((blank) => <div className="calendarCell empty" key={blank} />)}{days.map((day) => { const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; return <div className="calendarCell" key={dateKey}><strong>{day}</strong>{eventsFor(dateKey).map((event) => <span className="calendarEvent" key={event}>{event}</span>)}</div>; })}</div></section>;
}

function DraftWorkspace({ drafts, companies, onChange }: { drafts: Draft[]; companies: Company[]; onChange: (drafts: Draft[]) => void }) {
  const [form, setForm] = useState({ companyName: companies[0]?.name ?? "", type: "motivation" as AnswerType, title: "", body: "", status: "draft" as DraftStatus });
  function addDraft(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!form.title.trim()) return; onChange([{ id: createId("draft"), ...form, updatedAt: new Date().toISOString() }, ...drafts]); setForm({ ...form, title: "", body: "" }); }
  return <div className="splitLayout reverseOnSmall"><section className="surface"><div className="sectionHeader compact"><div><p className="eyebrow">Drafts</p><h3>ES下書き管理</h3></div></div><form className="contentStack" onSubmit={addDraft}><label>企業<select value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })}>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></label><label>種別<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AnswerType })}>{answerOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>タイトル<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>本文<textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label><button className="primaryButton" type="submit"><Save size={18} />保存</button></form></section><section className="contentStack">{drafts.map((draft) => <article className="surface" key={draft.id}><span className="tag">{draft.companyName} / {answerLabels[draft.type]}</span><h4>{draft.title}</h4><p>{draft.body}</p><div className="cardMeta"><span>{draft.status === "done" ? "完成" : draft.status === "review" ? "確認中" : "下書き"}</span><span>{formatDate(draft.updatedAt)}</span></div></article>)}</section></div>;
}

function PracticeWorkspace({ companies, sessions, onChange }: { companies: Company[]; sessions: PracticeSession[]; onChange: (sessions: PracticeSession[]) => void }) {
  const [companyName, setCompanyName] = useState(companies[0]?.name ?? "");
  const [theme, setTheme] = useState("一次面接");
  const [answer, setAnswer] = useState("");
  const session = sessions[0];
  const questions = ["まず自己紹介を1分程度でお願いします。", "その開発で一番苦労した点は何ですか？", "なぜその技術を選んだのですか？", "その経験を入社後にどう活かしたいですか？"];
  function start() { onChange([{ id: createId("practice"), companyName, theme, messages: [{ id: createId("msg"), role: "ai", body: questions[0] }] }, ...sessions]); }
  function send() { if (!session || !answer.trim()) return; const count = session.messages.filter((message) => message.role === "user").length; onChange(sessions.map((item) => item.id === session.id ? { ...item, messages: [...item.messages, { id: createId("msg"), role: "user", body: answer }, { id: createId("msg"), role: "ai", body: `ありがとうございます。次は、${questions[Math.min(count + 1, questions.length - 1)]}` }] } : item)); setAnswer(""); }
  return <div className="splitLayout reverseOnSmall"><section className="surface"><div className="sectionHeader compact"><div><p className="eyebrow">Practice</p><h3>AI面接練習モード</h3></div></div><div className="contentStack"><label>企業<select value={companyName} onChange={(event) => setCompanyName(event.target.value)}>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></label><label>テーマ<select value={theme} onChange={(event) => setTheme(event.target.value)}><option>一次面接</option><option>技術面接</option><option>最終面接</option></select></label><button className="primaryButton" onClick={start}><Bot size={18} />開始</button></div></section><section className="surface chatPanel"><div className="sectionHeader compact"><div><p className="eyebrow">Roleplay</p><h3>{session ? `${session.companyName} / ${session.theme}` : "練習セッション"}</h3></div></div><div className="messageList">{(session?.messages ?? []).map((message) => <div className={`messageBubble ${message.role}`} key={message.id}>{message.body}</div>)}</div><div className="chatComposer"><input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="回答を入力" /><button className="iconButton" title="送信" onClick={send}><Send size={18} /></button></div></section></div>;
}

function ObVisitWorkspace({ visits, companies, onChange }: { visits: ObVisit[]; companies: Company[]; onChange: (visits: ObVisit[]) => void }) {
  const [form, setForm] = useState({ companyName: companies[0]?.name ?? "", personName: "", role: "", visitDate: todayString(), questions: "", insights: "", followUp: "" });
  function addVisit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!form.personName.trim()) return; onChange([{ id: createId("visit"), ...form }, ...visits]); setForm({ ...form, personName: "", role: "", questions: "", insights: "", followUp: "" }); }
  return <div className="splitLayout reverseOnSmall"><section className="surface"><div className="sectionHeader compact"><div><p className="eyebrow">OB / OG</p><h3>訪問メモ</h3></div></div><form className="contentStack" onSubmit={addVisit}><label>企業<select value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })}>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></label><label>相手の名前<input value={form.personName} onChange={(event) => setForm({ ...form, personName: event.target.value })} /></label><label>職種・立場<input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /></label><label>日付<input type="date" value={form.visitDate} onChange={(event) => setForm({ ...form, visitDate: event.target.value })} /></label><label>質問<textarea value={form.questions} onChange={(event) => setForm({ ...form, questions: event.target.value })} /></label><label>学び<textarea value={form.insights} onChange={(event) => setForm({ ...form, insights: event.target.value })} /></label><label>次のアクション<textarea value={form.followUp} onChange={(event) => setForm({ ...form, followUp: event.target.value })} /></label><button className="primaryButton" type="submit"><Save size={18} />保存</button></form></section><section className="noteList">{visits.map((visit) => <article className="noteCard" key={visit.id}><span className="tag">{visit.companyName} / {formatDate(visit.visitDate)}</span><h4>{visit.personName}</h4><p>{visit.insights || visit.questions}</p><div className="cardMeta"><span>{visit.followUp || "次のアクション未設定"}</span></div></article>)}</section></div>;
}

function CompareWorkspace({ items, companies, onChange }: { items: CompareItem[]; companies: Company[]; onChange: (items: CompareItem[]) => void }) {
  const [form, setForm] = useState({ companyName: companies[0]?.name ?? "", salary: "", workStyle: "", techStack: "", culture: "", growth: "", score: 3 });
  function addItem(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onChange([{ id: createId("compare"), ...form }, ...items]); setForm({ ...form, salary: "", workStyle: "", techStack: "", culture: "", growth: "", score: 3 }); }
  return <div className="contentStack"><section className="surface"><div className="sectionHeader compact"><div><p className="eyebrow">Compare</p><h3>企業比較シート</h3></div></div><form className="formGrid" onSubmit={addItem}><label>企業<select value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })}>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></label><label>待遇<input value={form.salary} onChange={(event) => setForm({ ...form, salary: event.target.value })} /></label><label>働き方<input value={form.workStyle} onChange={(event) => setForm({ ...form, workStyle: event.target.value })} /></label><label>技術環境<input value={form.techStack} onChange={(event) => setForm({ ...form, techStack: event.target.value })} /></label><label>雰囲気<input value={form.culture} onChange={(event) => setForm({ ...form, culture: event.target.value })} /></label><label>成長<input value={form.growth} onChange={(event) => setForm({ ...form, growth: event.target.value })} /></label><label>総合<input type="number" min="1" max="5" value={form.score} onChange={(event) => setForm({ ...form, score: Number(event.target.value) })} /></label><button className="primaryButton" type="submit"><Plus size={18} />追加</button></form></section><section className="compareTable surface"><div className="compareHeader"><span>企業</span><span>待遇</span><span>働き方</span><span>技術</span><span>成長</span><span>総合</span></div>{items.map((item) => <div className="compareRow" key={item.id}><strong>{item.companyName}</strong><span>{item.salary}</span><span>{item.workStyle}</span><span>{item.techStack}</span><span>{item.growth}</span><strong>{item.score}/5</strong></div>)}</section></div>;
}

function AnalyticsWorkspace({ companies, drafts, notes }: { companies: Company[]; drafts: Draft[]; notes: InterviewNote[] }) {
  const applied = companies.filter((company) => company.status !== "preparing").length;
  const interview = companies.filter((company) => statusRank(company.status) >= 3).length;
  const offers = companies.filter((company) => company.status === "offer").length;
  const passRate = Math.round((interview / Math.max(1, applied)) * 100);
  const offerRate = Math.round((offers / Math.max(1, applied)) * 100);
  const stuckWords = notes.filter((note) => note.stuck).length;
  return <div className="contentStack"><section className="metricGrid"><Metric icon={<TrendingUp size={20} />} label="面接到達率" value={`${passRate}%`} /><Metric icon={<Target size={20} />} label="内定率" value={`${offerRate}%`} /><Metric icon={<FileText size={20} />} label="ES完成" value={`${drafts.filter((draft) => draft.status === "done").length}件`} /><Metric icon={<MessageSquareText size={20} />} label="詰まり記録" value={`${stuckWords}件`} /></section><DashboardCharts companies={companies} /><section className="surface chartPanel"><div className="sectionHeader compact"><div><p className="eyebrow">Funnel</p><h3>選考通過率</h3></div></div><BarRow label="応募" count={`${applied}社`} percent={100} /><BarRow label="面接到達" count={`${interview}社`} percent={(interview / Math.max(1, applied)) * 100} /><BarRow label="内定" count={`${offers}社`} percent={(offers / Math.max(1, applied)) * 100} /></section></div>;
}

function WeeklyWorkspace({ reports, companies, drafts, notes, onChange }: { reports: WeeklyReport[]; companies: Company[]; drafts: Draft[]; notes: InterviewNote[]; onChange: (reports: WeeklyReport[]) => void }) {
  const [form, setForm] = useState({ weekOf: todayString(), wins: "", blockers: "", nextFocus: "" });
  function addReport(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const summary = `応募中は${companies.filter((company) => company.status !== "preparing").length}社、未完成ESは${drafts.filter((draft) => draft.status !== "done").length}件、面接メモは${notes.length}件です。次週は${form.nextFocus || "優先企業の準備"}に集中します。`; onChange([{ id: createId("weekly"), ...form, summary }, ...reports]); setForm({ weekOf: todayString(), wins: "", blockers: "", nextFocus: "" }); }
  return <div className="splitLayout reverseOnSmall"><section className="surface"><div className="sectionHeader compact"><div><p className="eyebrow">Weekly</p><h3>週次振り返りレポート</h3></div></div><form className="contentStack" onSubmit={addReport}><label>週<input type="date" value={form.weekOf} onChange={(event) => setForm({ ...form, weekOf: event.target.value })} /></label><label>よかったこと<textarea value={form.wins} onChange={(event) => setForm({ ...form, wins: event.target.value })} /></label><label>詰まったこと<textarea value={form.blockers} onChange={(event) => setForm({ ...form, blockers: event.target.value })} /></label><label>次週の重点<textarea value={form.nextFocus} onChange={(event) => setForm({ ...form, nextFocus: event.target.value })} /></label><button className="primaryButton" type="submit"><Save size={18} />作成</button></form></section><section className="contentStack">{reports.map((report) => <article className="surface" key={report.id}><span className="tag">{formatDate(report.weekOf)}</span><h4>週次レポート</h4><p>{report.summary}</p></article>)}</section></div>;
}

function LaunchWorkspace() {
  const items = ["Vercelプロジェクトを作成", "Supabase URL と anon key を設定", "OpenAI APIキーを設定", "スマホ表示を確認", "プライバシーポリシーを追加", "READMEのセットアップ手順を確認"];
  return <div className="contentStack"><section className="surface"><div className="sectionHeader compact"><div><p className="eyebrow">Launch</p><h3>本番公開準備</h3></div><span className="tag">Vercel / Supabase</span></div><div className="savedQuestions">{items.map((item) => <label className="checkRow" key={item}><input type="checkbox" readOnly /><span>{item}</span></label>)}</div></section><section className="surface"><h4>環境変数</h4><p>NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY、OPENAI_API_KEY、OPENAI_MODEL をVercelに設定します。</p></section></div>;
}
