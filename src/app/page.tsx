"use client";

import {
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
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
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

type View = "dashboard" | "companies" | "ai" | "notes";

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
  return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(() => readStorage<UserProfile | null>(userStorageKey, null));
  const [companies, setCompanies] = useState<Company[]>(() => readStorage<Company[]>(companyStorageKey, seedCompanies));
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

    return { interviews, unfinished, highPriority };
  }, [companies]);

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
          <button className={view === "dashboard" ? "navButton active" : "navButton"} onClick={() => setView("dashboard")}>
            <ClipboardList size={18} />
            ダッシュボード
          </button>
          <button className={view === "companies" ? "navButton active" : "navButton"} onClick={() => setView("companies")}>
            <BriefcaseBusiness size={18} />
            企業管理
          </button>
          <button className={view === "ai" ? "navButton active" : "navButton"} onClick={() => setView("ai")}>
            <Sparkles size={18} />
            AI変換
          </button>
          <button className={view === "notes" ? "navButton active" : "navButton"} onClick={() => setView("notes")}>
            <MessageSquareText size={18} />
            面接メモ
          </button>
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

function Dashboard({ companies, stats, onSelect }: { companies: Company[]; stats: { interviews: number; unfinished: number; highPriority: number }; onSelect: (id: string) => void }) {
  return (
    <div className="contentStack">
      <section className="metricGrid">
        <Metric icon={<BriefcaseBusiness size={20} />} label="登録企業" value={`${companies.length}社`} />
        <Metric icon={<CalendarDays size={20} />} label="面接予定" value={`${stats.interviews}件`} />
        <Metric icon={<FileText size={20} />} label="未完成回答" value={`${stats.unfinished}件`} />
        <Metric icon={<Target size={20} />} label="志望度 高" value={`${stats.highPriority}社`} />
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

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
