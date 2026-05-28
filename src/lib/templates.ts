import { AnswerType, Priority, SelectionStatus, TransformMode } from "./types";

export const statusLabels: Record<SelectionStatus, string> = {
  preparing: "準備中",
  applied: "応募済み",
  document: "書類選考",
  firstInterview: "一次面接",
  finalInterview: "最終面接",
  offer: "内定",
  rejected: "終了",
};

export const priorityLabels: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const answerLabels: Record<AnswerType, string> = {
  motivation: "志望動機",
  selfPr: "自己PR",
  gakuchika: "ガクチカ",
};

export const transformLabels: Record<TransformMode, string> = {
  es: "ES用",
  interview: "面接用",
  oneMinute: "1分版",
  twoHundred: "200字版",
  fourHundred: "400字版",
  itAppeal: "IT企業向け",
  sier: "SIer向け",
  web: "Web系向け",
};

export const statusOptions = Object.entries(statusLabels) as [SelectionStatus, string][];
export const priorityOptions = Object.entries(priorityLabels) as [Priority, string][];
export const answerOptions = Object.entries(answerLabels) as [AnswerType, string][];
export const transformOptions = Object.entries(transformLabels) as [TransformMode, string][];

export const reverseQuestionTemplates = [
  {
    category: "仕事内容",
    questions: [
      "新人が最初に任される業務には、どのようなものがありますか？",
      "若手のうちから設計や要件定義に関われる機会はありますか？",
      "開発以外に、顧客折衝や改善提案へ関わる場面はありますか？",
    ],
  },
  {
    category: "技術環境",
    questions: [
      "現場でよく使われている言語やフレームワークを教えてください。",
      "技術選定では、若手も意見を出せる雰囲気がありますか？",
      "コードレビューや設計レビューはどのように行われていますか？",
    ],
  },
  {
    category: "研修",
    questions: [
      "入社後の研修では、実務に入る前にどのような力を伸ばしますか？",
      "配属後、業務知識はどのように身につけていくのでしょうか？",
      "入社前に特に学んでおくと良い技術や考え方はありますか？",
    ],
  },
  {
    category: "成長",
    questions: [
      "新入社員が早期に成長するために大切な姿勢は何ですか？",
      "若手エンジニアの評価では、どのような点を重視されていますか？",
      "活躍している若手社員にはどのような共通点がありますか？",
    ],
  },
];
