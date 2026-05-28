# JobStock AI

情報系学生・専門学校生・IT職志望者向けの、就活ES・面接回答ストック管理アプリです。

## いま入っている機能

- デモログイン
- ダッシュボードの選考進捗グラフ
- 志望業界ごとの応募数、選考ステータス割合の可視化
- 企業管理、ES締切、応募締切、次回面接日、企業別タスク
- 志望動機、自己PR、ガクチカの保存
- AI文章変換、深掘り質問、ポートフォリオ説明、面接後フィードバック
- 企業別Q&A掲示板
- 面接対策チェックリスト
- カレンダービュー
- ES下書き管理
- AI面接練習モード
- OB・OG訪問メモ
- 企業比較シート
- 選考通過率分析
- 週次振り返りレポート
- 本番公開準備チェック
- ブラウザのローカルストレージへの自動保存

## 技術スタック

- Next.js
- TypeScript
- React
- lucide-react
- グローバルCSSによる軽量な初期UI

## セットアップ

```bash
npm install
npm run dev
```

OpenAI APIを使う場合は、`.env.local` を作成してください。

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

APIキーがない場合でも、AI変換ボタンはデモ用の簡易変換で動作します。

## Supabase 本番化メモ

現在はローカルストレージで動くMVPです。Supabaseへ移行する場合は、`docs/supabase-schema.sql` をSupabase SQL Editorで実行し、Auth、Database、Realtimeを有効化します。

優先してDB化する順番:

1. profiles / companies
2. forum_posts / forum_answers
3. ai_logs
4. interview_notes / drafts / weekly_reports

企業別Q&Aは、`forum_posts` と `forum_answers` を Supabase Realtime の購読対象にすると、他ユーザーの投稿が即時反映される構成にできます。

## ローカル配置

OneDrive配下ではなく、次の場所を想定しています。

```text
C:\dev\jobstockAI
```
