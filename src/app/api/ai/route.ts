import { NextResponse } from "next/server";
import { answerLabels, transformLabels } from "@/lib/templates";
import { AnswerType, TransformMode } from "@/lib/types";

type AiRequest = {
  text?: string;
  mode?: TransformMode;
  answerType?: AnswerType;
  companyName?: string;
  industry?: string;
  jobType?: string;
};

function fallbackTransform({ text, mode, answerType, companyName, industry, jobType }: Required<AiRequest>) {
  const label = transformLabels[mode];
  const answerLabel = answerLabels[answerType];
  const company = companyName ? `${companyName}向け` : "応募企業向け";
  const context = [industry, jobType].filter(Boolean).join(" / ");

  if (mode === "interview" || mode === "oneMinute") {
    return [
      `${company}の${answerLabel}として、面接で話しやすい形に整理しました。`,
      context ? `前提として、${context}に関心があることを自然に入れます。` : "",
      `私が伝えたいことは、${text}`,
      "特に意識したのは、結論、具体的な経験、そこから学んだことの順で話すことです。入社後も、経験を再現できる力として活かしていきたいです。",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (mode === "twoHundred") {
    return `${company}の${answerLabel}として要点を200字程度に整理します。${text}`.slice(0, 210);
  }

  if (mode === "fourHundred") {
    return `${company}の${answerLabel}として、結論、経験、学び、入社後の活かし方が伝わるように整えます。${text} この経験から、課題を一つずつ整理し、周囲と協力しながら改善する大切さを学びました。入社後も、技術だけでなく相手の課題を理解する姿勢を大切にし、価値のある開発に貢献したいです。`.slice(0, 420);
  }

  if (mode === "itAppeal" || mode === "sier" || mode === "web") {
    return `${label}の観点で整理しました。\n\n${text}\n\nこの経験では、単に技術を使っただけでなく、課題を見つけ、原因を分け、改善策を実装した点を強調できます。面接では、使用技術、担当範囲、工夫した点、結果の順で話すと伝わりやすくなります。`;
  }

  return `${label}として読みやすい表現に整えました。\n\n${text}\n\n結論を先に置き、具体的な経験と学びが伝わるように調整してください。`;
}

function extractOutputText(data: unknown) {
  const response = data as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  const fromParts = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((part) => part.text ?? "")
    .filter(Boolean)
    .join("\n");

  return fromParts?.trim() ?? "";
}

export async function POST(request: Request) {
  const body = (await request.json()) as AiRequest;
  const text = body.text?.trim();
  const mode = body.mode ?? "interview";
  const answerType = body.answerType ?? "selfPr";
  const companyName = body.companyName ?? "";
  const industry = body.industry ?? "";
  const jobType = body.jobType ?? "";

  if (!text) {
    return NextResponse.json({ error: "変換する文章を入力してください。" }, { status: 400 });
  }

  const fallback = fallbackTransform({ text, mode, answerType, companyName, industry, jobType });
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ result: fallback, source: "fallback" });
  }

  const prompt = `あなたは情報系学生・専門学校生の就活支援に強いキャリアコーチです。\n元の経験を盛りすぎず、本人が面接で自然に話せる表現にしてください。\n\n企業: ${companyName || "未設定"}\n業界: ${industry || "未設定"}\n志望職種: ${jobType || "未設定"}\n回答種別: ${answerLabels[answerType]}\n変換タイプ: ${transformLabels[mode]}\n\n元の文章:\n${text}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "回答は日本語。結論、具体例、学び、入社後の活かし方が自然につながるように整える。過度に立派な表現へ盛らない。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ result: fallback, source: "fallback" });
    }

    const data = await response.json();
    const result = extractOutputText(data);

    return NextResponse.json({ result: result || fallback, source: result ? "openai" : "fallback" });
  } catch {
    return NextResponse.json({ result: fallback, source: "fallback" });
  }
}
