export type Plan = "free" | "paid";

export type SelectionStatus =
  | "preparing"
  | "applied"
  | "document"
  | "firstInterview"
  | "finalInterview"
  | "offer"
  | "rejected";

export type Priority = "high" | "medium" | "low";

export type AnswerType = "motivation" | "selfPr" | "gakuchika";

export type TransformMode =
  | "es"
  | "interview"
  | "oneMinute"
  | "twoHundred"
  | "fourHundred"
  | "itAppeal"
  | "sier"
  | "web";

export type UserProfile = {
  name: string;
  email: string;
  plan: Plan;
  aiUsed: number;
  aiLimit: number;
};

export type Answer = {
  type: AnswerType;
  content: string;
  aiVersion: string;
  updatedAt: string;
};

export type ReverseQuestion = {
  id: string;
  category: string;
  question: string;
  used: boolean;
};

export type InterviewNote = {
  id: string;
  interviewDate: string;
  questions: string;
  answered: string;
  stuck: string;
  reaction: string;
  reflection: string;
  nextActions: string;
  result: string;
  aiFeedback: string;
};

export type Company = {
  id: string;
  name: string;
  industry: string;
  jobType: string;
  status: SelectionStatus;
  priority: Priority;
  nextInterview: string;
  memo: string;
  answers: Record<AnswerType, Answer>;
  reverseQuestions: ReverseQuestion[];
  interviewNotes: InterviewNote[];
  updatedAt: string;
};
