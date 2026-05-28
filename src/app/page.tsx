"use client";

import {
  BarChart3,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  MessageSquareText,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { createAnswers, seedCompanies } from "@/lib/seed";
import {
  answerLabels,
  answerOptions,
  priorityLabels,
  priorityOptions,
  reverseQuestionTemplates,
  statusLabels,
  statusOptions,
  transformLabels,
  transformOptions,
} from "@/lib/templates";
import { AnswerType, Company, InterviewNote, Priority, SelectionStatus, TransformMode, UserProfile } from "@/lib/types";

const userStorageKey = "jobstock:user";
const companyStorageKey = "jobstock:companies";
const boardStorageKey = "jobstock:board-posts";
const checklistStorageKey = "jobstock:checklist";
const draftStorageKey = "jobstock:es-drafts";
const practiceStorageKey = "jobstock:practice-sessions";
const obVisitStorageKey = "jobstock:ob-visits";
const compareStorageKey = "jobstock:offer-compare";
const weeklyStorageKey = "jobstock:weekly-reports";

type View =
  | "dashboard"
  | "companies"
  | "ai"
  | "notes"
  | "board"
  | "checklist"
  | "calendar"
  | "drafts"
  | "practice"
  | "obVisits"
  | "compare"
  | "analytics"
  | "weekly";

type BoardAnswer = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

type BoardPost = {
  id: string;
  companyName: string;
  title: string;
  question: string;
  category: string;
  createdAt: string;
  answers: BoardAnswer[];
};

type ChecklistItem = {
  id: string;
  category: string;
  label: string;
  done: boolean;
};

type EsDraft = {
  id: string;
  companyName: string;
  type: AnswerType;
  title: string;
  content: string;
  status: "draft" | "review" | "done";
  updatedAt: string;
};

type PracticeMessage = {
  id: string;
  role: "ai" | "user";
  body: string;
  createdAt: string;
};

type PracticeSession = {
  id: string;
  companyName: string;
  theme: string;
  messages: PracticeMessage[];
  updatedAt: string;
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

type OfferCompare = {
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
  applications: number;
  interviews: number;
  aiSummary: string;
};

type CountItem = {
  label: string;
  count: number;
};

const initialChecklist: ChecklistItem[] = [
  { id: "check-1", category: "面接前", label: "企業情報と事業内容を確認する", done: false },
  { id: "check-2", category: "面接前", label: "志望動機を1分で話せる形にする", done: false },
  { id: "check-3", category: "面接前", label: "自己PRとガクチカの深掘り質問を準備する", done: false },
  { id: "check-4", category: "面接前", label: "ポートフォリオの担当範囲と工夫を整理する", done: false },
  { id: "check-5", category: "面接中", label: "結論、経験、学びの順で話す", done: false },
  { id: "check-6", category: "面接中", label: "技術名だけでなく課題と成果を伝える", done: false },
  { id: "check-7", category: "面接後", label: "聞かれた質問と詰まった内容を記録する", done: false },
  { id: "check-8", category: "面接後", label: "次回までの改善点を1つ決める", done: false },
];

const initialBoardPosts: BoardPost[] = [
  {
    id: "board-demo-1",
    companyName: "ミライシステムズ",
    title: "一次面接で聞かれたこと",
    question: "Webエンジニア職の一次面接では、開発経験についてどこまで深掘りされましたか？",
    category: "一次面接",
    createdAt: new Date().toISOString(),
    answers: [
      {
        id: "answer-demo-1",
        author: "先輩ユーザー",
        body: "担当範囲、苦労した点、なぜその技術を選んだかを聞かれました。成果だけでなく、判断理由を話せると強いです。",
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

const initialDrafts: EsDraft[] = [
  {
    id: "draft-demo-1",
    companyName: "コードキャンバス",
    type: "motivation",
    title: "Webサービス向け志望動機",
    content: "ユーザーに近い立場で改善を続けられる開発に携わりたいです。",
    status: "draft",
    updatedAt: new Date().toISOString(),
  },
];

const practiceQuestions = [
  "まず自己紹介を1分程度でお願いします。",
  "その開発で一番苦労した点は何ですか？",
  "なぜその技術を選んだのですか？",
  "チーム内でのあなたの役割は何でしたか？",
  "その経験を入社後にどう活かしたいですか？",
];

const statusColorClass: Record<SelectionStatus, string> = {
  preparing: "status-preparing",
  applied: "status-applied",
  document: "status-document",
  firstInterview: "status-firstInterview",
  finalInterview: "status-finalInterview",
  offer: "status-offer",
  rejected: "status-rejected",
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createCompany(): Company {
  return {
    id: createId("company"),
    name: "新しい企業",
    industry: "IT",
    jobType: "Webエンジニア",
    status: "preparing",
    priority: "medium",
    nextInterview: "",
    memo: "",
    answers: createAnswers(),
    reverseQuestions: [],
    interviewNotes: [],
    updatedAt: new Date().toISOString(),
  };
}

function formatDate(value: string) {
  if (!value) return "未定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未定";
  return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(date);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function countBy<T>(items: T[], labeler: (item: T) => string): CountItem[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const label = labeler(item) || "未設定";
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function statusRank(status: SelectionStatus) {
  const ranks: Record<SelectionStatus, number> = {
    preparing: 0,
    applied: 1,
    document: 2,
    firstInterview: 3,
    finalInterview: 4,
    offer: 5,
    rejected: 1,
  };
  return ranks[status];
}

function buildPracticeReply(answerCount: number) {
  const next = practiceQuestions[Math.min(answerCount + 1, practiceQuestions.length - 1)];
  return `ありがとうございます。今の回答は具体例があるとさらに伝わります。次に、${next}`;
}

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(() => readStorage<UserProfile | null>(userStorageKey, null));
  const [companies, setCompanies] = useState<Company[]>(() => readStorage<Company[]>(companyStorageKey, seedCompanies));
  const [boardPosts, setBoardPosts] = useState<BoardPost[]>(() => readStorage<BoardPost[]>(boardStorageKey, initialBoardPosts));
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => readStorage<ChecklistItem[]>(checklistStorageKey, initialChecklist));
  const [drafts, setDrafts] = useState<EsDraft[]>(() => readStorage<EsDraft[]>(draftStorageKey, initialDrafts));
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>(() => readStorage<PracticeSession[]>(practiceStorageKey, []));
  const [obVisits, setObVisits] = useState<ObVisit[]>(() => readStorage<ObVisit[]>(obVisitStorageKey, []));
  const [comparisons, setComparisons] = useState<OfferCompare[]>(() => readStorage<OfferCompare[]>(compareStorageKey, []));
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>(() => readStorage<WeeklyReport[]>(weeklyStorageKey, []));
  const [selectedId, setSelectedId] = useState(() => companies[0]?.id ?? "");
  const [view, setView] = useState<View>("dashboard");
  const [activeAnswer, setActiveAnswer] = useState<AnswerType>("motivation");
  const [aiMode, setAiMode] = useState<TransformMode>("interview");
  const [aiResult, setAiResult] = useState("");
  const [aiSource, setAiSource] = useState<"openai" | "fallback" | "">("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedCompany = companies.find((company) => company.id === selectedId) ?? companies[0];

  const stats = useMemo(() => {
    const interviews = companies.filter((company) => company.nextInterview).length;
    const unfinished = companies.reduce(
      (count, company) => count + Object.values(company.answers).filter((answer) => !answer.content.trim()).length,
      0,
    );
    const highPriority = companies.filter((company) => company.priority === "high").length;
    const doneChecklist = checklist.filter((item) => item.done).length;

    return { interviews, unfinished, highPriority, doneChecklist };
  }, [companies, checklist]);

  function persistCompanies(nextCompanies: Company[]) {
    setCompanies(nextCompanies);
    writeStorage(companyStorageKey, nextCompanies);
  }

  function persistUser(nextUser: UserProfile | null) {
    setUser(nextUser);
    if (nextUser) {
      writeStorage(userStorageKey, nextUser);
    } else if (typeof window !== "undefined") {
      window.localStorage.removeItem(userStorageKey);
    }
  }

  function updateCompany(id: string, updater: (company: Company) => Company) {
    const nextCompanies = companies.map((company) =>
      company.id === id ? { ...updater(company), updatedAt: new Date().toISOString() } : company,
    );
    persistCompanies(nextCompanies);
  }

  function addCompany() {
    const nextCompany = createCompany();
    persistCompanies([nextCompany, ...companies]);
    setSelectedId(nextCompany.id);
    setView("companies");
  }

  function saveReverseQuestion(category: string, question: string) {
    if (!selectedCompany) return;
    updateCompany(selectedCompany.id, (company) => ({
      ...company,
      reverseQuestions: [
        ...company.reverseQuestions,
        { id: createId("question"), category, question, used: false },
      ],
    }));
  }

  async function generateAi() {
    if (!selectedCompany) return;
    const sourceText = selectedCompany.answers[activeAnswer].content.trim();
    if (!sourceText) {
      setAiResult("先に変換したい回答を入力してください。");
      setAiSource("fallback");
      return;
    }

    setIsGenerating(true);
    setAiResult("");
    setAiSource("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          mode: aiMode,
          answerType: activeAnswer,
          companyName: selectedCompany.name,
          industry: selectedCompany.industry,
          jobType: selectedCompany.jobType,
        }),
      });
      const data = (await response.json()) as { result?: string; source?: "openai" | "fallback"; error?: string };
      setAiResult(data.result ?? data.error ?? "変換に失敗しました。");
      setAiSource(data.source ?? "fallback");

      if (user) {
        persistUser({ ...user, aiUsed: user.aiUsed + 1 });
      }
    } catch {
      setAiResult("通信に失敗しました。入力内容を保存したまま、もう一度試してください。");
      setAiSource("fallback");
    } finally {
      setIsGenerating(false);
    }
  }

  function saveAiResult() {
    if (!selectedCompany || !aiResult.trim()) return;
    updateCompany(selectedCompany.id, (company) => ({
      ...company,
      answers: {
        ...company.answers,
        [activeAnswer]: {
          ...company.answers[activeAnswer],
          aiVersion: aiResult,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }

  if (!user) {
    return <LoginScreen onLogin={persistUser} />;
  }

  const navItems: Array<{ view: View; label: string; icon: ReactNode }> = [
    { view: "dashboard", label: "ダッシュボード", icon: <ClipboardList size={18} /> },
    { view: "companies", label: "企業管理", icon: <BriefcaseBusiness size={18} /> },
    { view: "ai", label: "AI変換", icon: <Sparkles size={18} /> },
    { view: "notes", label: "面接メモ", icon: <MessageSquareText size={18} /> },
    { view: "board", label: "企業別Q&A", icon: <MessageSquareText size={18} /> },
    { view: "checklist", label: "チェックリスト", icon: <Check size={18} /> },
    { view: "calendar", label: "カレンダー", icon: <CalendarDays size={18} /> },
    { view: "drafts", label: "ES下書き", icon: <FileText size={18} /> },
    { view: "practice", label: "面接練習", icon: <Bot size={18} /> },
    { view: "obVisits", label: "OB/OGメモ", icon: <Users size={18} /> },
    { view: "compare", label: "比較シート", icon: <Scale size={18} /> },
    { view: "analytics", label: "通過率分析", icon: <TrendingUp size={18} /> },
    { view: "weekly", label: "週次レポート", icon: <BookOpen size={18} /> },
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
          {navItems.map((item) => (
            <button key={item.view} className={view === item.view ? "navButton active" : "navButton"} onClick={() => setView(item.view)}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="planBox">
          <div>
            <span className="tag">{user.plan === "free" ? "Free" : "Paid"}</span>
            <p>{user.aiUsed} / {user.aiLimit} 回</p>
          </div>
          <button className="iconButton" title="ログアウト" onClick={() => persistUser(null)}>
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

        {view === "dashboard" && (
          <Dashboard
            companies={companies}
            stats={stats}
            onSelect={(id) => {
              setSelectedId(id);
              setView("companies");
            }}
            onOpenView={setView}
          />
        )}

        {view === "companies" && selectedCompany && (
          <CompanyWorkspace
            company={selectedCompany}
            companies={companies}
            activeAnswer={activeAnswer}
            onSelectCompany={setSelectedId}
            onActiveAnswer={setActiveAnswer}
            onUpdateCompany={updateCompany}
            onSaveTemplate={saveReverseQuestion}
          />
        )}

        {view === "ai" && selectedCompany && (
          <AiWorkspace
            company={selectedCompany}
            activeAnswer={activeAnswer}
            aiMode={aiMode}
            aiResult={aiResult}
            aiSource={aiSource}
            isGenerating={isGenerating}
            onActiveAnswer={setActiveAnswer}
            onAiMode={setAiMode}
            onGenerate={generateAi}
            onSave={saveAiResult}
          />
        )}

        {view === "notes" && selectedCompany && <InterviewWorkspace company={selectedCompany} onUpdateCompany={updateCompany} />}

        {view === "board" && (
          <BoardWorkspace
            posts={boardPosts}
            companies={companies}
            userName={user.name}
            onChange={(nextPosts) => {
              setBoardPosts(nextPosts);
              writeStorage(boardStorageKey, nextPosts);
            }}
          />
        )}

        {view === "checklist" && (
          <ChecklistWorkspace
            items={checklist}
            onChange={(nextItems) => {
              setChecklist(nextItems);
              writeStorage(checklistStorageKey, nextItems);
            }}
          />
        )}

        {view === "calendar" && <CalendarWorkspace companies={companies} />}

        {view === "drafts" && (
          <DraftWorkspace
            drafts={drafts}
            companies={companies}
            onChange={(nextDrafts) => {
              setDrafts(nextDrafts);
              writeStorage(draftStorageKey, nextDrafts);
            }}
          />
        )}

        {view === "practice" && (
          <PracticeWorkspace
            companies={companies}
            sessions={practiceSessions}
            onChange={(nextSessions) => {
              setPracticeSessions(nextSessions);
              writeStorage(practiceStorageKey, nextSessions);
            }}
          />
        )}

        {view === "obVisits" && (
          <ObVisitWorkspace
            visits={obVisits}
            companies={companies}
            onChange={(nextVisits) => {
              setObVisits(nextVisits);
              writeStorage(obVisitStorageKey, nextVisits);
            }}
          />
        )}

        {view === "compare" && (
          <CompareWorkspace
            items={comparisons}
            companies={companies}
            onChange={(nextItems) => {
              setComparisons(nextItems);
              writeStorage(compareStorageKey, nextItems);
            }}
          />
        )}

        {view === "analytics" && <AnalyticsWorkspace companies={companies} drafts={drafts} />}

        {view === "weekly" && (
          <WeeklyWorkspace
            reports={weeklyReports}
            companies={companies}
            drafts={drafts}
            onChange={(nextReports) => {
              setWeeklyReports(nextReports);
              writeStorage(weeklyStorageKey, nextReports);
            }}
          />
        )}
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: UserProfile) => void }) {
  const [name, setName] = useState("kirua");
  const [email, setEmail] = useState("kirua@example.com");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin({ name: name.trim() || "ユーザー", email: email.trim(), plan: "free", aiUsed: 0, aiLimit: 10 });
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
        <label>
          名前
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          メール
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button className="primaryButton fullButton" type="submit">
          <UserRound size={18} />
          デモログイン
        </button>
      </form>
    </main>
  );
}

function Dashboard({
  companies,
  stats,
  onSelect,
  onOpenView,
}: {
  companies: Company[];
  stats: { interviews: number; unfinished: number; highPriority: number; doneChecklist: number };
  onSelect: (id: string) => void;
  onOpenView: (view: View) => void;
}) {
  return (
    <div className="contentStack">
      <section className="metricGrid">
        <Metric icon={<BriefcaseBusiness size={20} />} label="登録企業" value={`${companies.length}社`} />
        <Metric icon={<CalendarDays size={20} />} label="面接予定" value={`${stats.interviews}件`} />
        <Metric icon={<FileText size={20} />} label="未完成回答" value={`${stats.unfinished}件`} />
        <Metric icon={<Check size={20} />} label="完了チェック" value={`${stats.doneChecklist}件`} />
      </section>

      <DashboardCharts companies={companies} />

      <section className="quickActionGrid">
        <button className="quickAction" onClick={() => onOpenView("board")}>
          <MessageSquareText size={18} />
          <span>企業別Q&A</span>
        </button>
        <button className="quickAction" onClick={() => onOpenView("practice")}>
          <Bot size={18} />
          <span>面接練習</span>
        </button>
        <button className="quickAction" onClick={() => onOpenView("analytics")}>
          <BarChart3 size={18} />
          <span>通過率分析</span>
        </button>
        <button className="quickAction" onClick={() => onOpenView("weekly")}>
          <BookOpen size={18} />
          <span>週次レポート</span>
        </button>
      </section>

      <section className="sectionHeader">
        <div>
          <p className="eyebrow">Recently edited</p>
          <h3>最近の企業</h3>
        </div>
      </section>

      <section className="companyGrid">
        {companies.map((company) => (
          <button key={company.id} className="companyCard" onClick={() => onSelect(company.id)}>
            <div className="companyCardTop">
              <div>
                <span className={`priority priority-${company.priority}`}>志望度 {priorityLabels[company.priority]}</span>
                <h4>{company.name}</h4>
              </div>
              <ChevronRight size={18} />
            </div>
            <p>{company.industry} / {company.jobType}</p>
            <div className="cardMeta">
              <span>{statusLabels[company.status]}</span>
              <span>次回 {formatDate(company.nextInterview)}</span>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}

function DashboardCharts({ companies }: { companies: Company[] }) {
  const industryCounts = countBy(companies, (company) => company.industry);
  const maxIndustry = Math.max(1, ...industryCounts.map((item) => item.count));
  const total = Math.max(1, companies.length);
  const statusCounts = statusOptions.map(([status, label]) => ({
    status,
    label,
    count: companies.filter((company) => company.status === status).length,
  }));

  return (
    <section className="chartGrid">
      <div className="surface chartPanel">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">Industry</p>
            <h3>志望業界ごとの応募数</h3>
          </div>
          <BarChart3 size={20} />
        </div>
        <div className="barList">
          {industryCounts.map((item) => (
            <div className="barRow" key={item.label}>
              <div className="barText">
                <span>{item.label}</span>
                <strong>{item.count}社</strong>
              </div>
              <div className="barTrack">
                <span style={{ width: `${Math.max(8, (item.count / maxIndustry) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="surface chartPanel">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">Status</p>
            <h3>選考ステータスの割合</h3>
          </div>
          <TrendingUp size={20} />
        </div>
        <div className="stackedBar" aria-label="選考ステータス割合">
          {statusCounts.map((item) =>
            item.count > 0 ? (
              <span
                key={item.status}
                className={`statusSlice ${statusColorClass[item.status]}`}
                style={{ width: `${(item.count / total) * 100}%` }}
                title={`${item.label}: ${item.count}社`}
              />
            ) : null,
          )}
        </div>
        <div className="legendGrid">
          {statusCounts.map((item) => (
            <div key={item.status} className="legendItem">
              <span className={`legendDot ${statusColorClass[item.status]}`} />
              <span>{item.label}</span>
              <strong>{Math.round((item.count / total) * 100)}%</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metricBox">
      <div className="metricIcon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompanyWorkspace({
  company,
  companies,
  activeAnswer,
  onSelectCompany,
  onActiveAnswer,
  onUpdateCompany,
  onSaveTemplate,
}: {
  company: Company;
  companies: Company[];
  activeAnswer: AnswerType;
  onSelectCompany: (id: string) => void;
  onActiveAnswer: (type: AnswerType) => void;
  onUpdateCompany: (id: string, updater: (company: Company) => Company) => void;
  onSaveTemplate: (category: string, question: string) => void;
}) {
  const answer = company.answers[activeAnswer];

  return (
    <div className="splitLayout">
      <aside className="companyRail">
        {companies.map((item) => (
          <button key={item.id} className={item.id === company.id ? "railItem active" : "railItem"} onClick={() => onSelectCompany(item.id)}>
            <strong>{item.name}</strong>
            <span>{statusLabels[item.status]}</span>
          </button>
        ))}
      </aside>

      <div className="contentStack">
        <section className="formGrid surface">
          <label>
            企業名
            <input value={company.name} onChange={(event) => onUpdateCompany(company.id, (current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            業界
            <input value={company.industry} onChange={(event) => onUpdateCompany(company.id, (current) => ({ ...current, industry: event.target.value }))} />
          </label>
          <label>
            志望職種
            <input value={company.jobType} onChange={(event) => onUpdateCompany(company.id, (current) => ({ ...current, jobType: event.target.value }))} />
          </label>
          <label>
            選考状況
            <select value={company.status} onChange={(event) => onUpdateCompany(company.id, (current) => ({ ...current, status: event.target.value as SelectionStatus }))}>
              {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            志望度
            <select value={company.priority} onChange={(event) => onUpdateCompany(company.id, (current) => ({ ...current, priority: event.target.value as Priority }))}>
              {priorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            次回面接日
            <input type="date" value={company.nextInterview} onChange={(event) => onUpdateCompany(company.id, (current) => ({ ...current, nextInterview: event.target.value }))} />
          </label>
          <label className="wideField">
            企業メモ
            <textarea value={company.memo} onChange={(event) => onUpdateCompany(company.id, (current) => ({ ...current, memo: event.target.value }))} />
          </label>
        </section>

        <section className="surface">
          <div className="sectionHeader compact">
            <div>
              <p className="eyebrow">Answers</p>
              <h3>回答ストック</h3>
            </div>
            <div className="segmented">
              {answerOptions.map(([value, label]) => (
                <button key={value} className={activeAnswer === value ? "active" : ""} onClick={() => onActiveAnswer(value)}>{label}</button>
              ))}
            </div>
          </div>
          <textarea
            className="mainTextarea"
            value={answer.content}
            onChange={(event) => onUpdateCompany(company.id, (current) => ({
              ...current,
              answers: {
                ...current.answers,
                [activeAnswer]: { ...current.answers[activeAnswer], content: event.target.value, updatedAt: new Date().toISOString() },
              },
            }))}
          />
          {answer.aiVersion && (
            <div className="aiSavedBox">
              <span>保存済みAI変換</span>
              <p>{answer.aiVersion}</p>
            </div>
          )}
        </section>

        <section className="surface">
          <div className="sectionHeader compact">
            <div>
              <p className="eyebrow">Questions</p>
              <h3>逆質問テンプレート</h3>
            </div>
          </div>
          <div className="templateGrid">
            {reverseQuestionTemplates.map((group) => (
              <div key={group.category} className="templateColumn">
                <h4>{group.category}</h4>
                {group.questions.map((question) => (
                  <button key={question} className="templateButton" onClick={() => onSaveTemplate(group.category, question)}>
                    <Plus size={16} />
                    {question}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {company.reverseQuestions.length > 0 && (
            <div className="savedQuestions">
              {company.reverseQuestions.map((question) => (
                <label key={question.id} className="checkRow">
                  <input
                    type="checkbox"
                    checked={question.used}
                    onChange={(event) => onUpdateCompany(company.id, (current) => ({
                      ...current,
                      reverseQuestions: current.reverseQuestions.map((item) => item.id === question.id ? { ...item, used: event.target.checked } : item),
                    }))}
                  />
                  <span>{question.question}</span>
                </label>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AiWorkspace({
  company,
  activeAnswer,
  aiMode,
  aiResult,
  aiSource,
  isGenerating,
  onActiveAnswer,
  onAiMode,
  onGenerate,
  onSave,
}: {
  company: Company;
  activeAnswer: AnswerType;
  aiMode: TransformMode;
  aiResult: string;
  aiSource: "openai" | "fallback" | "";
  isGenerating: boolean;
  onActiveAnswer: (type: AnswerType) => void;
  onAiMode: (mode: TransformMode) => void;
  onGenerate: () => void;
  onSave: () => void;
}) {
  return (
    <div className="contentStack">
      <section className="surface aiStudio">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">AI Studio</p>
            <h3>{company.name}の回答変換</h3>
          </div>
        </div>

        <div className="controlGrid">
          <label>
            回答種別
            <select value={activeAnswer} onChange={(event) => onActiveAnswer(event.target.value as AnswerType)}>
              {answerOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            変換タイプ
            <select value={aiMode} onChange={(event) => onAiMode(event.target.value as TransformMode)}>
              {transformOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <div className="previewGrid">
          <div>
            <span className="previewLabel">入力</span>
            <p className="previewBox">{company.answers[activeAnswer].content || `${answerLabels[activeAnswer]}がまだ入力されていません。`}</p>
          </div>
          <div>
            <span className="previewLabel">出力 {aiSource && <small>{aiSource === "openai" ? "OpenAI" : "Demo"}</small>}</span>
            <p className="previewBox result">{aiResult || `${transformLabels[aiMode]}へ変換した結果がここに表示されます。`}</p>
          </div>
        </div>

        <div className="actionRow">
          <button className="primaryButton" onClick={onGenerate} disabled={isGenerating}>
            {isGenerating ? <RefreshCw className="spin" size={18} /> : <Sparkles size={18} />}
            変換する
          </button>
          <button className="secondaryButton" onClick={onSave} disabled={!aiResult.trim()}>
            <Save size={18} />
            回答へ保存
          </button>
        </div>
      </section>
    </div>
  );
}

function InterviewWorkspace({ company, onUpdateCompany }: { company: Company; onUpdateCompany: (id: string, updater: (company: Company) => Company) => void }) {
  const [note, setNote] = useState<Omit<InterviewNote, "id">>({
    interviewDate: "",
    questions: "",
    answered: "",
    stuck: "",
    reaction: "",
    reflection: "",
    nextActions: "",
    result: "",
    aiFeedback: "",
  });

  function addNote() {
    onUpdateCompany(company.id, (current) => ({
      ...current,
      interviewNotes: [{ id: createId("note"), ...note }, ...current.interviewNotes],
    }));
    setNote({ interviewDate: "", questions: "", answered: "", stuck: "", reaction: "", reflection: "", nextActions: "", result: "", aiFeedback: "" });
  }

  return (
    <div className="contentStack">
      <section className="surface">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">Interview</p>
            <h3>{company.name}の面接メモ</h3>
          </div>
        </div>
        <div className="formGrid">
          <label>
            面接日
            <input type="date" value={note.interviewDate} onChange={(event) => setNote({ ...note, interviewDate: event.target.value })} />
          </label>
          <label>
            結果
            <input value={note.result} onChange={(event) => setNote({ ...note, result: event.target.value })} placeholder="例: 結果待ち" />
          </label>
        </div>
        <div className="memoGrid">
          <label>
            聞かれた質問
            <textarea value={note.questions} onChange={(event) => setNote({ ...note, questions: event.target.value })} />
          </label>
          <label>
            答えられた内容
            <textarea value={note.answered} onChange={(event) => setNote({ ...note, answered: event.target.value })} />
          </label>
          <label>
            詰まった質問
            <textarea value={note.stuck} onChange={(event) => setNote({ ...note, stuck: event.target.value })} />
          </label>
          <label>
            次回改善点
            <textarea value={note.nextActions} onChange={(event) => setNote({ ...note, nextActions: event.target.value })} />
          </label>
        </div>
        <button className="primaryButton" onClick={addNote}>
          <Check size={18} />
          メモを保存
        </button>
      </section>

      <section className="noteList">
        {company.interviewNotes.map((item) => (
          <article className="noteCard" key={item.id}>
            <div className="companyCardTop">
              <div>
                <span className="tag">{formatDate(item.interviewDate)}</span>
                <h4>{item.result || "面接メモ"}</h4>
              </div>
            </div>
            <p>{item.questions || "質問メモなし"}</p>
            <div className="cardMeta">
              <span>詰まった点: {item.stuck || "なし"}</span>
              <span>次回: {item.nextActions || "未設定"}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function BoardWorkspace({ posts, companies, userName, onChange }: { posts: BoardPost[]; companies: Company[]; userName: string; onChange: (posts: BoardPost[]) => void }) {
  const [form, setForm] = useState({ companyName: companies[0]?.name ?? "", title: "", category: "一次面接", question: "" });
  const [answerText, setAnswerText] = useState<Record<string, string>>({});

  function addPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.question.trim()) return;
    const nextPost: BoardPost = {
      id: createId("post"),
      companyName: form.companyName || "未設定",
      title: form.title,
      category: form.category,
      question: form.question,
      createdAt: new Date().toISOString(),
      answers: [],
    };
    onChange([nextPost, ...posts]);
    setForm({ ...form, title: "", question: "" });
  }

  function addAnswer(postId: string) {
    const body = answerText[postId]?.trim();
    if (!body) return;
    onChange(posts.map((post) => post.id === postId ? {
      ...post,
      answers: [...post.answers, { id: createId("answer"), author: userName, body, createdAt: new Date().toISOString() }],
    } : post));
    setAnswerText({ ...answerText, [postId]: "" });
  }

  return (
    <div className="splitLayout reverseOnSmall">
      <section className="surface">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">Community</p>
            <h3>企業別Q&A掲示板</h3>
          </div>
          <span className="tag">Live</span>
        </div>
        <form className="contentStack" onSubmit={addPost}>
          <label>
            企業
            <select value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })}>
              {companies.map((company) => <option key={company.id} value={company.name}>{company.name}</option>)}
            </select>
          </label>
          <label>
            カテゴリ
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option>一次面接</option>
              <option>二次面接</option>
              <option>最終面接</option>
              <option>ES</option>
              <option>逆質問</option>
            </select>
          </label>
          <label>
            タイトル
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label>
            質問
            <textarea value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} />
          </label>
          <button className="primaryButton" type="submit">
            <Send size={18} />
            投稿する
          </button>
        </form>
      </section>

      <section className="contentStack">
        {posts.map((post) => (
          <article className="surface boardPost" key={post.id}>
            <div className="companyCardTop">
              <div>
                <span className="tag">{post.companyName} / {post.category}</span>
                <h4>{post.title}</h4>
              </div>
              <span className="answerCount">{post.answers.length}件</span>
            </div>
            <p className="boardQuestion">{post.question}</p>
            <div className="answerList">
              {post.answers.map((answer) => (
                <div className="answerBubble" key={answer.id}>
                  <strong>{answer.author}</strong>
                  <p>{answer.body}</p>
                </div>
              ))}
            </div>
            <div className="chatComposer">
              <input value={answerText[post.id] ?? ""} onChange={(event) => setAnswerText({ ...answerText, [post.id]: event.target.value })} placeholder="回答を書く" />
              <button className="iconButton" title="送信" onClick={() => addAnswer(post.id)}>
                <Send size={18} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ChecklistWorkspace({ items, onChange }: { items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void }) {
  const grouped = countBy(items, (item) => item.category).map((group) => ({ ...group, items: items.filter((item) => item.category === group.label) }));
  const progress = Math.round((items.filter((item) => item.done).length / Math.max(1, items.length)) * 100);

  return (
    <div className="contentStack">
      <section className="surface">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">Checklist</p>
            <h3>面接対策チェックリスト</h3>
          </div>
          <strong className="progressNumber">{progress}%</strong>
        </div>
        <div className="barTrack largeTrack"><span style={{ width: `${progress}%` }} /></div>
      </section>
      <section className="featureGrid">
        {grouped.map((group) => (
          <div className="surface" key={group.label}>
            <h4>{group.label}</h4>
            <div className="savedQuestions">
              {group.items.map((item) => (
                <label key={item.id} className="checkRow">
                  <input type="checkbox" checked={item.done} onChange={(event) => onChange(items.map((current) => current.id === item.id ? { ...current, done: event.target.checked } : current))} />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function CalendarWorkspace({ companies }: { companies: Company[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDay.getDay() }, (_, index) => index);
  const days = Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const events = companies.flatMap((company) => {
      const items = [];
      if (company.nextInterview === dateKey) items.push(`${company.name} 面接`);
      company.interviewNotes.forEach((note) => {
        if (note.interviewDate === dateKey) items.push(`${company.name} メモ`);
      });
      return items;
    });
    return { day, dateKey, events };
  });

  return (
    <section className="surface">
      <div className="sectionHeader compact">
        <div>
          <p className="eyebrow">Calendar</p>
          <h3>{year}年{month + 1}月</h3>
        </div>
      </div>
      <div className="calendarGrid calendarWeekdays">
        {['日', '月', '火', '水', '木', '金', '土'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendarGrid">
        {blanks.map((blank) => <div className="calendarCell empty" key={`blank-${blank}`} />)}
        {days.map((item) => (
          <div className="calendarCell" key={item.dateKey}>
            <strong>{item.day}</strong>
            {item.events.map((event) => <span className="calendarEvent" key={event}>{event}</span>)}
          </div>
        ))}
      </div>
    </section>
  );
}

function DraftWorkspace({ drafts, companies, onChange }: { drafts: EsDraft[]; companies: Company[]; onChange: (drafts: EsDraft[]) => void }) {
  const [form, setForm] = useState({ companyName: companies[0]?.name ?? "", type: "motivation" as AnswerType, title: "", content: "", status: "draft" as EsDraft["status"] });

  function addDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    onChange([{ id: createId("draft"), ...form, updatedAt: new Date().toISOString() }, ...drafts]);
    setForm({ ...form, title: "", content: "" });
  }

  function updateDraft(id: string, updater: (draft: EsDraft) => EsDraft) {
    onChange(drafts.map((draft) => draft.id === id ? { ...updater(draft), updatedAt: new Date().toISOString() } : draft));
  }

  return (
    <div className="splitLayout reverseOnSmall">
      <section className="surface">
        <div className="sectionHeader compact"><div><p className="eyebrow">Drafts</p><h3>ES下書き管理</h3></div></div>
        <form className="contentStack" onSubmit={addDraft}>
          <label>企業<select value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })}>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></label>
          <label>種別<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AnswerType })}>{answerOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>タイトル<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>本文<textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
          <button className="primaryButton" type="submit"><Save size={18} />保存</button>
        </form>
      </section>
      <section className="contentStack">
        {drafts.map((draft) => (
          <article className="surface" key={draft.id}>
            <div className="companyCardTop"><div><span className="tag">{draft.companyName} / {answerLabels[draft.type]}</span><h4>{draft.title}</h4></div></div>
            <textarea value={draft.content} onChange={(event) => updateDraft(draft.id, (current) => ({ ...current, content: event.target.value }))} />
            <select value={draft.status} onChange={(event) => updateDraft(draft.id, (current) => ({ ...current, status: event.target.value as EsDraft["status"] }))}>
              <option value="draft">下書き</option><option value="review">確認中</option><option value="done">完成</option>
            </select>
          </article>
        ))}
      </section>
    </div>
  );
}

function PracticeWorkspace({ companies, sessions, onChange }: { companies: Company[]; sessions: PracticeSession[]; onChange: (sessions: PracticeSession[]) => void }) {
  const [companyName, setCompanyName] = useState(companies[0]?.name ?? "");
  const [theme, setTheme] = useState("一次面接");
  const [answer, setAnswer] = useState("");
  const activeSession = sessions[0];

  function startSession() {
    const session: PracticeSession = {
      id: createId("practice"),
      companyName,
      theme,
      updatedAt: new Date().toISOString(),
      messages: [{ id: createId("message"), role: "ai", body: practiceQuestions[0], createdAt: new Date().toISOString() }],
    };
    onChange([session, ...sessions]);
  }

  function sendAnswer() {
    if (!activeSession || !answer.trim()) return;
    const userMessage: PracticeMessage = { id: createId("message"), role: "user", body: answer, createdAt: new Date().toISOString() };
    const aiMessage: PracticeMessage = { id: createId("message"), role: "ai", body: buildPracticeReply(activeSession.messages.filter((message) => message.role === "user").length), createdAt: new Date().toISOString() };
    onChange(sessions.map((session) => session.id === activeSession.id ? { ...session, messages: [...session.messages, userMessage, aiMessage], updatedAt: new Date().toISOString() } : session));
    setAnswer("");
  }

  return (
    <div className="splitLayout reverseOnSmall">
      <section className="surface">
        <div className="sectionHeader compact"><div><p className="eyebrow">Practice</p><h3>AI面接練習モード</h3></div></div>
        <div className="contentStack">
          <label>企業<select value={companyName} onChange={(event) => setCompanyName(event.target.value)}>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></label>
          <label>テーマ<select value={theme} onChange={(event) => setTheme(event.target.value)}><option>一次面接</option><option>技術面接</option><option>最終面接</option></select></label>
          <button className="primaryButton" onClick={startSession}><Bot size={18} />開始</button>
        </div>
      </section>
      <section className="surface chatPanel">
        <div className="sectionHeader compact"><div><p className="eyebrow">Roleplay</p><h3>{activeSession ? `${activeSession.companyName} / ${activeSession.theme}` : "練習セッション"}</h3></div></div>
        <div className="messageList">
          {(activeSession?.messages ?? []).map((message) => <div className={`messageBubble ${message.role}`} key={message.id}>{message.body}</div>)}
        </div>
        <div className="chatComposer">
          <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="回答を入力" />
          <button className="iconButton" title="送信" onClick={sendAnswer}><Send size={18} /></button>
        </div>
      </section>
    </div>
  );
}

function ObVisitWorkspace({ visits, companies, onChange }: { visits: ObVisit[]; companies: Company[]; onChange: (visits: ObVisit[]) => void }) {
  const [form, setForm] = useState({ companyName: companies[0]?.name ?? "", personName: "", role: "", visitDate: todayString(), questions: "", insights: "", followUp: "" });

  function addVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.personName.trim()) return;
    onChange([{ id: createId("visit"), ...form }, ...visits]);
    setForm({ ...form, personName: "", role: "", questions: "", insights: "", followUp: "" });
  }

  return (
    <div className="splitLayout reverseOnSmall">
      <section className="surface">
        <div className="sectionHeader compact"><div><p className="eyebrow">OB / OG</p><h3>訪問メモ</h3></div></div>
        <form className="contentStack" onSubmit={addVisit}>
          <label>企業<select value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })}>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></label>
          <label>相手の名前<input value={form.personName} onChange={(event) => setForm({ ...form, personName: event.target.value })} /></label>
          <label>職種・立場<input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /></label>
          <label>日付<input type="date" value={form.visitDate} onChange={(event) => setForm({ ...form, visitDate: event.target.value })} /></label>
          <label>質問<textarea value={form.questions} onChange={(event) => setForm({ ...form, questions: event.target.value })} /></label>
          <label>学び<textarea value={form.insights} onChange={(event) => setForm({ ...form, insights: event.target.value })} /></label>
          <button className="primaryButton" type="submit"><Save size={18} />保存</button>
        </form>
      </section>
      <section className="noteList">
        {visits.map((visit) => <article className="noteCard" key={visit.id}><span className="tag">{visit.companyName} / {formatDate(visit.visitDate)}</span><h4>{visit.personName}</h4><p>{visit.insights || visit.questions}</p></article>)}
      </section>
    </div>
  );
}

function CompareWorkspace({ items, companies, onChange }: { items: OfferCompare[]; companies: Company[]; onChange: (items: OfferCompare[]) => void }) {
  const [form, setForm] = useState({ companyName: companies[0]?.name ?? "", salary: "", workStyle: "", techStack: "", culture: "", growth: "", score: 3 });

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange([{ id: createId("compare"), ...form }, ...items]);
    setForm({ ...form, salary: "", workStyle: "", techStack: "", culture: "", growth: "", score: 3 });
  }

  return (
    <div className="contentStack">
      <section className="surface">
        <div className="sectionHeader compact"><div><p className="eyebrow">Compare</p><h3>社内比較シート</h3></div></div>
        <form className="formGrid" onSubmit={addItem}>
          <label>企業<select value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })}>{companies.map((company) => <option key={company.id}>{company.name}</option>)}</select></label>
          <label>待遇<input value={form.salary} onChange={(event) => setForm({ ...form, salary: event.target.value })} /></label>
          <label>働き方<input value={form.workStyle} onChange={(event) => setForm({ ...form, workStyle: event.target.value })} /></label>
          <label>技術環境<input value={form.techStack} onChange={(event) => setForm({ ...form, techStack: event.target.value })} /></label>
          <label>雰囲気<input value={form.culture} onChange={(event) => setForm({ ...form, culture: event.target.value })} /></label>
          <label>成長<input value={form.growth} onChange={(event) => setForm({ ...form, growth: event.target.value })} /></label>
          <label>総合<input type="number" min="1" max="5" value={form.score} onChange={(event) => setForm({ ...form, score: Number(event.target.value) })} /></label>
          <button className="primaryButton" type="submit"><Plus size={18} />追加</button>
        </form>
      </section>
      <section className="compareTable surface">
        <div className="compareHeader"><span>企業</span><span>待遇</span><span>働き方</span><span>技術</span><span>成長</span><span>総合</span></div>
        {items.map((item) => <div className="compareRow" key={item.id}><strong>{item.companyName}</strong><span>{item.salary}</span><span>{item.workStyle}</span><span>{item.techStack}</span><span>{item.growth}</span><strong>{item.score}/5</strong></div>)}
      </section>
    </div>
  );
}

function AnalyticsWorkspace({ companies, drafts }: { companies: Company[]; drafts: EsDraft[] }) {
  const applied = companies.filter((company) => company.status !== "preparing").length;
  const interview = companies.filter((company) => statusRank(company.status) >= 3).length;
  const offers = companies.filter((company) => company.status === "offer").length;
  const passRate = Math.round((interview / Math.max(1, applied)) * 100);
  const offerRate = Math.round((offers / Math.max(1, applied)) * 100);
  const completedDrafts = drafts.filter((draft) => draft.status === "done").length;

  return (
    <div className="contentStack">
      <section className="metricGrid">
        <Metric icon={<TrendingUp size={20} />} label="面接到達率" value={`${passRate}%`} />
        <Metric icon={<Target size={20} />} label="内定率" value={`${offerRate}%`} />
        <Metric icon={<FileText size={20} />} label="ES完成" value={`${completedDrafts}件`} />
        <Metric icon={<BriefcaseBusiness size={20} />} label="応募済み" value={`${applied}社`} />
      </section>
      <DashboardCharts companies={companies} />
      <section className="surface chartPanel">
        <div className="sectionHeader compact"><div><p className="eyebrow">Funnel</p><h3>選考通過率</h3></div></div>
        {[
          { label: "応募", count: applied },
          { label: "面接到達", count: interview },
          { label: "内定", count: offers },
        ].map((item) => <div className="barRow" key={item.label}><div className="barText"><span>{item.label}</span><strong>{item.count}社</strong></div><div className="barTrack"><span style={{ width: `${(item.count / Math.max(1, applied)) * 100}%` }} /></div></div>)}
      </section>
    </div>
  );
}

function WeeklyWorkspace({ reports, companies, drafts, onChange }: { reports: WeeklyReport[]; companies: Company[]; drafts: EsDraft[]; onChange: (reports: WeeklyReport[]) => void }) {
  const [form, setForm] = useState({ weekOf: todayString(), wins: "", blockers: "", nextFocus: "" });
  const applications = companies.filter((company) => company.status !== "preparing").length;
  const interviews = companies.filter((company) => company.nextInterview).length;

  function addReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const unfinishedDrafts = drafts.filter((draft) => draft.status !== "done").length;
    const aiSummary = `応募済みは${applications}社、面接予定は${interviews}件、未完成ESは${unfinishedDrafts}件です。次週は${form.nextFocus || "優先企業の準備"}に集中します。`;
    onChange([{ id: createId("weekly"), ...form, applications, interviews, aiSummary }, ...reports]);
    setForm({ weekOf: todayString(), wins: "", blockers: "", nextFocus: "" });
  }

  return (
    <div className="splitLayout reverseOnSmall">
      <section className="surface">
        <div className="sectionHeader compact"><div><p className="eyebrow">Weekly</p><h3>週次振り返りレポート</h3></div></div>
        <form className="contentStack" onSubmit={addReport}>
          <label>週<input type="date" value={form.weekOf} onChange={(event) => setForm({ ...form, weekOf: event.target.value })} /></label>
          <label>よかったこと<textarea value={form.wins} onChange={(event) => setForm({ ...form, wins: event.target.value })} /></label>
          <label>詰まったこと<textarea value={form.blockers} onChange={(event) => setForm({ ...form, blockers: event.target.value })} /></label>
          <label>次週の重点<textarea value={form.nextFocus} onChange={(event) => setForm({ ...form, nextFocus: event.target.value })} /></label>
          <button className="primaryButton" type="submit"><Save size={18} />作成</button>
        </form>
      </section>
      <section className="contentStack">
        {reports.map((report) => <article className="surface" key={report.id}><span className="tag">{formatDate(report.weekOf)}</span><h4>週次レポート</h4><p>{report.aiSummary}</p><div className="cardMeta"><span>応募 {report.applications}社</span><span>面接 {report.interviews}件</span></div></article>)}
      </section>
    </div>
  );
}
