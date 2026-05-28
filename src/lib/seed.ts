import { AnswerType, Company } from "./types";

const now = new Date().toISOString();

export function createAnswers(): Company["answers"] {
  const makeAnswer = (type: AnswerType) => ({
    type,
    content: "",
    aiVersion: "",
    updatedAt: now,
  });

  return {
    motivation: makeAnswer("motivation"),
    selfPr: makeAnswer("selfPr"),
    gakuchika: makeAnswer("gakuchika"),
  };
}

export const seedCompanies: Company[] = [
  {
    id: "company-demo-1",
    name: "ミライシステムズ",
    industry: "SIer",
    jobType: "Webエンジニア",
    status: "firstInterview",
    priority: "high",
    nextInterview: "",
    memo: "公共系の業務改善案件が多い。チーム開発経験を強めに話す。",
    answers: {
      ...createAnswers(),
      motivation: {
        type: "motivation",
        content: "専門学校で学んだWeb開発の知識を活かし、業務の課題をシステムで解決できるエンジニアになりたいと考えています。貴社は若手のうちから設計や顧客理解に関われる点に魅力を感じています。",
        aiVersion: "",
        updatedAt: now,
      },
      selfPr: {
        type: "selfPr",
        content: "私の強みは、課題を分解して改善を続けられることです。チーム開発では、画面表示の遅さをログと計測で原因分解し、API呼び出しの回数を減らして改善しました。",
        aiVersion: "",
        updatedAt: now,
      },
    },
    reverseQuestions: [],
    interviewNotes: [],
    updatedAt: now,
  },
  {
    id: "company-demo-2",
    name: "コードキャンバス",
    industry: "Webサービス",
    jobType: "フロントエンドエンジニア",
    status: "document",
    priority: "medium",
    nextInterview: "",
    memo: "ポートフォリオのUI改善とユーザー視点を中心に整理する。",
    answers: createAnswers(),
    reverseQuestions: [],
    interviewNotes: [],
    updatedAt: now,
  },
];
