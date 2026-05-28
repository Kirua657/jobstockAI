# JobStock AI

情報系学生・専門学校生・IT職志望者向けの、就活ES・面接回答ストック管理アプリです。

## MVPでできること

- デモログイン
- 企業ごとの選考情報管理
- 志望動機、自己PR、ガクチカの保存
- AI文章変換（OpenAI APIキーがない場合はローカルの簡易変換で動作）
- ダッシュボードでの選考進捗グラフ
- 志望業界ごとの応募数可視化
- 選考ステータス割合の可視化
- 企業別Q&A掲示板
- 面接対策チェックリスト
- カレンダービュー
- ES下書き管理
- AI面接練習モード
- OB・OG訪問メモ
- 社内比較シート
- 選考通過率の分析
- 週次振り返りレポート
- 逆質問テンプレートの表示と保存
- 面接メモ、振り返り、次回改善点の保存
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
```

APIキーがない場合でも、アプリのAI変換ボタンはデモ用の簡易変換で動作します。

## 企業別Q&Aの本番化メモ

現在のQ&A掲示板はMVPとしてブラウザ保存で動作します。本番で「すでに受けている人が回答してくれる」リアルタイム会話にする場合は、Supabase Auth と Supabase Realtime を使い、企業別の質問、回答、通知をDBに保存する構成へ拡張します。

## 今後の拡張候補

- Supabase Auth による本番ログイン
- PostgreSQL / Supabase Database への保存
- Supabase Realtime による企業別Q&Aのリアルタイム同期
- AI生成回数制限と ai_logs 管理
- 面接深掘り質問生成
- ポートフォリオ説明支援
- PDF出力
- 有料プラン、広告、アフィリエイト導入

## 開発メモ

提案書のMVP範囲に合わせ、最初の版はフロントエンド中心のプロトタイプとして作っています。次の段階で Supabase Auth / PostgreSQL / 課金 / PDF出力 を追加できる構成です。

ローカルに置く場合は、OneDrive配下ではなく次の場所を想定しています。

```text
C:\dev\jobstockAI
```
