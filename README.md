# JobStock AI

情報系学生・専門学校生・IT職志望者向けの、就活ES・面接回答ストック管理アプリです。

## MVPでできること

- デモログイン
- 企業ごとの選考情報管理
- 志望動機、自己PR、ガクチカの保存
- AI文章変換（OpenAI APIキーがない場合はローカルの簡易変換で動作）
- 逆質問テンプレートの表示と保存
- 面接メモ、振り返り、次回改善点の保存
- ブラウザのローカルストレージへの自動保存

## 技術スタック

- Next.js
- TypeScript
- React
- lucide-react
- CSS ModulesではなくグローバルCSSによる軽量な初期UI

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

## 開発メモ

提案書のMVP範囲に合わせ、最初の版はフロントエンド中心のプロトタイプとして作っています。次の段階で Supabase Auth / PostgreSQL / 課金 / PDF出力 を追加できる構成です。

ローカルに置く場合は、OneDrive配下ではなく次の場所を想定しています。

```text
C:\dev\jobstockAI
```
