"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type Status = "preparing" | "applied" | "document" | "firstInterview" | "finalInterview" | "offer" | "rejected";
type Priority = "high" | "medium" | "low";
type AnswerType = "motivation" | "selfPr" | "gakuchika";

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

type CompanyRow = {
  id: string;
  name: string;
  industry: string;
  job_type: string;
  status: Status;
  priority: Priority;
  next_interview: string | null;
  es_deadline: string | null;
  entry_deadline: string | null;
  memo: string;
  answers: Record<AnswerType, string> | null;
  tasks: Task[] | null;
};

type ForumPostRow = {
  id: string;
  company_name: string;
  phase: string;
  title: string;
  body: string;
  created_at: string;
};

type ForumAnswerRow = {
  id: string;
  post_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

const storagePrefix = "jobstock:v2:";
const companiesStorageKey = `${storagePrefix}companies`;
const forumStorageKey = `${storagePrefix}forum`;
const defaultAnswers: Record<AnswerType, string> = { motivation: "", selfPr: "", gakuchika: "" };

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function emptyToNull(value: string) {
  return value.trim() ? value : null;
}

function normalizeAnswers(value: Record<AnswerType, string> | null): Record<AnswerType, string> {
  return {
    ...defaultAnswers,
    ...(value ?? {}),
  };
}

function companyFromRow(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    jobType: row.job_type,
    status: row.status,
    priority: row.priority,
    nextInterview: row.next_interview ?? "",
    esDeadline: row.es_deadline ?? "",
    entryDeadline: row.entry_deadline ?? "",
    memo: row.memo,
    answers: normalizeAnswers(row.answers),
    tasks: Array.isArray(row.tasks) ? row.tasks : [],
  };
}

function companyToRow(company: Company, userId: string) {
  return {
    id: company.id,
    user_id: userId,
    name: company.name,
    industry: company.industry,
    job_type: company.jobType,
    status: company.status,
    priority: company.priority,
    next_interview: emptyToNull(company.nextInterview),
    es_deadline: emptyToNull(company.esDeadline),
    entry_deadline: emptyToNull(company.entryDeadline),
    memo: company.memo,
    answers: company.answers,
    tasks: company.tasks,
  };
}

function buildForum(posts: ForumPostRow[], answers: ForumAnswerRow[]): ForumPost[] {
  return posts.map((post) => ({
    id: post.id,
    companyName: post.company_name,
    phase: post.phase,
    title: post.title,
    body: post.body,
    createdAt: post.created_at,
    answers: answers
      .filter((answer) => answer.post_id === post.id)
      .map((answer) => ({
        id: answer.id,
        author: answer.author_name,
        body: answer.body,
        createdAt: answer.created_at,
      })),
  }));
}

async function ensureAnonymousSession(supabase: SupabaseClient) {
  const current = await supabase.auth.getSession();
  if (current.data.session?.user.id) return current.data.session.user.id;

  const created = await supabase.auth.signInAnonymously();
  if (created.error || !created.data.user?.id) {
    throw new Error(created.error?.message ?? "Anonymous auth is not enabled.");
  }

  return created.data.user.id;
}

async function syncCompanies(supabase: SupabaseClient, userId: string, companies: Company[]) {
  if (companies.length === 0) return;
  const rows = companies.map((company) => companyToRow(company, userId));
  const { error } = await supabase.from("companies").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

async function pullCompanies(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("id,name,industry,job_type,status,priority,next_interview,es_deadline,entry_deadline,memo,answers,tasks")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const remoteCompanies = (data ?? []) as CompanyRow[];

  if (remoteCompanies.length > 0) {
    window.localStorage.setItem(companiesStorageKey, JSON.stringify(remoteCompanies.map(companyFromRow)));
    return true;
  }

  const localCompanies = safeParse<Company[]>(window.localStorage.getItem(companiesStorageKey), []);
  await syncCompanies(supabase, userId, localCompanies);
  return false;
}

async function pullForum(supabase: SupabaseClient, rememberRemoteIds: (posts: ForumPostRow[], answers: ForumAnswerRow[]) => void) {
  const [postResult, answerResult] = await Promise.all([
    supabase.from("forum_posts").select("id,company_name,phase,title,body,created_at").order("created_at", { ascending: false }).limit(80),
    supabase.from("forum_answers").select("id,post_id,author_name,body,created_at").order("created_at", { ascending: true }).limit(300),
  ]);

  if (postResult.error) throw postResult.error;
  if (answerResult.error) throw answerResult.error;

  const posts = (postResult.data ?? []) as ForumPostRow[];
  const answers = (answerResult.data ?? []) as ForumAnswerRow[];
  rememberRemoteIds(posts, answers);

  if (posts.length > 0) {
    window.localStorage.setItem(forumStorageKey, JSON.stringify(buildForum(posts, answers)));
  }
}

async function syncNewForumItems(
  supabase: SupabaseClient,
  userId: string,
  posts: ForumPost[],
  remoteIds: { posts: Set<string>; answers: Set<string> },
) {
  const newPosts = posts.filter((post) => !remoteIds.posts.has(post.id));
  const newAnswers = posts.flatMap((post) =>
    post.answers
      .filter((answer) => !remoteIds.answers.has(answer.id))
      .map((answer) => ({ postId: post.id, answer })),
  );

  if (newPosts.length > 0) {
    const { error } = await supabase.from("forum_posts").insert(
      newPosts.map((post) => ({
        id: post.id,
        user_id: userId,
        company_name: post.companyName,
        phase: post.phase,
        title: post.title,
        body: post.body,
        created_at: post.createdAt,
      })),
    );
    if (!error) newPosts.forEach((post) => remoteIds.posts.add(post.id));
  }

  if (newAnswers.length > 0) {
    const { error } = await supabase.from("forum_answers").insert(
      newAnswers.map(({ postId, answer }) => ({
        id: answer.id,
        post_id: postId,
        user_id: userId,
        author_name: answer.author,
        body: answer.body,
        created_at: answer.createdAt,
      })),
    );
    if (!error) newAnswers.forEach(({ answer }) => remoteIds.answers.add(answer.id));
  }
}

export default function SupabaseBridge({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState(0);
  const suppressSyncRef = useRef(false);
  const remoteIdsRef = useRef({ posts: new Set<string>(), answers: new Set<string>() });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setReady(true);
      return;
    }

    let active = true;
    let companyTimer: ReturnType<typeof setTimeout> | null = null;
    let forumTimer: ReturnType<typeof setTimeout> | null = null;
    const storagePrototype = Storage.prototype;
    const originalSetItem = storagePrototype.setItem;
    let userId = "";

    function rememberRemoteIds(posts: ForumPostRow[], answers: ForumAnswerRow[]) {
      remoteIdsRef.current.posts = new Set(posts.map((post) => post.id));
      remoteIdsRef.current.answers = new Set(answers.map((answer) => answer.id));
    }

    function replaceStorage(key: string, value: unknown) {
      suppressSyncRef.current = true;
      window.localStorage.setItem(key, JSON.stringify(value));
      suppressSyncRef.current = false;
      if (active) setAppVersion((version) => version + 1);
    }

    async function refreshForum() {
      try {
        await pullForum(supabase, rememberRemoteIds);
        if (active) setAppVersion((version) => version + 1);
      } catch (error) {
        console.warn("Supabase forum refresh failed", error);
      }
    }

    storagePrototype.setItem = function patchedSetItem(this: Storage, key: string, value: string) {
      originalSetItem.call(this, key, value);
      if (suppressSyncRef.current || !userId) return;

      if (key === companiesStorageKey) {
        if (companyTimer) clearTimeout(companyTimer);
        companyTimer = setTimeout(() => {
          const companies = safeParse<Company[]>(value, []);
          syncCompanies(supabase, userId, companies).catch((error) => console.warn("Supabase company sync failed", error));
        }, 500);
      }

      if (key === forumStorageKey) {
        if (forumTimer) clearTimeout(forumTimer);
        forumTimer = setTimeout(() => {
          const posts = safeParse<ForumPost[]>(value, []);
          syncNewForumItems(supabase, userId, posts, remoteIdsRef.current).catch((error) => console.warn("Supabase forum sync failed", error));
        }, 500);
      }
    };

    async function boot() {
      setStatus("Supabase接続中");
      try {
        userId = await ensureAnonymousSession(supabase);
        suppressSyncRef.current = true;
        const usedRemoteCompanies = await pullCompanies(supabase, userId);
        await pullForum(supabase, rememberRemoteIds);
        suppressSyncRef.current = false;

        const channel = supabase
          .channel("jobstock-forum")
          .on("postgres_changes", { event: "*", schema: "public", table: "forum_posts" }, refreshForum)
          .on("postgres_changes", { event: "*", schema: "public", table: "forum_answers" }, refreshForum)
          .subscribe();

        if (active) {
          setStatus(usedRemoteCompanies ? "Supabase同期中" : "Supabase保存準備OK");
          setReady(true);
        }

        return () => {
          void supabase.removeChannel(channel);
        };
      } catch (error) {
        suppressSyncRef.current = false;
        console.warn("Supabase bridge fallback", error);
        if (active) {
          setStatus("Supabase設定待ち・ローカル保存中");
          setReady(true);
        }
        return undefined;
      }
    }

    let cleanupChannel: (() => void) | undefined;
    void boot().then((cleanup) => {
      cleanupChannel = cleanup;
    });

    return () => {
      active = false;
      storagePrototype.setItem = originalSetItem;
      if (companyTimer) clearTimeout(companyTimer);
      if (forumTimer) clearTimeout(forumTimer);
      cleanupChannel?.();
    };
  }, []);

  if (!ready) {
    return (
      <main className="loginShell">
        <section className="loginPanel">
          <div className="brandBlock loginBrand">
            <div className="brandMark">JS</div>
            <div>
              <p className="eyebrow">JobStock AI</p>
              <h1>Supabase接続を確認中</h1>
            </div>
          </div>
          <p className="hintText">少しだけ待ってください。保存先を準備しています。</p>
        </section>
      </main>
    );
  }

  return (
    <>
      {status && <div className="syncBadge">{status}</div>}
      <div key={appVersion}>{children}</div>
    </>
  );
}
