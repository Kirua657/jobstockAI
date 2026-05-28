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
- Supabaseへの企業データ保存、Q&A掲示板の同期準備
- ブラウザのローカルストレージへの自動保存

## 技術スタック

- Next.js
- TypeScript
- React
- Supabase
- lucide-react
- グローバルCSSによる軽量な初期UI

## セットアップ

```bash
npm install
npm run dev
```

`.env.local` を作成して、必要な環境変数を入れます。

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
```

APIキーがない場合でも、AI変換ボタンはデモ用の簡易変換で動作します。

## Supabase設定

1. SupabaseのFreeプロジェクトを作成します。
2. `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を `.env.local` に入れます。
3. SupabaseのSQL Editorで `docs/supabase-schema.sql` を実行します。
4. SupabaseのAuthentication設定で匿名ログインを有効にします。
5. ローカルアプリを再起動します。

アプリ右下の表示が `Supabase同期中` または `Supabase保存準備OK` になれば接続できています。`Supabase設定待ち・ローカル保存中` の場合は、SQL実行または匿名ログイン設定を確認してください。

企業データはログインした匿名ユーザーごとに非公開で保存されます。企業別Q&Aは、他ユーザーも読める掲示板として保存され、Realtimeの対象になります。

## 既存スキーマを実行済みの場合

古い `docs/supabase-schema.sql` をすでに実行していて、まだ大事なデータが入っていない場合は、Supabase側でJobStock用テーブルをリセットしてから最新SQLを実行してください。

対象テーブル:

- `companies`
- `forum_answers`
- `forum_posts`
- `ai_logs`
- `profiles`

## ローカル配置

OneDrive配下ではなく、次の場所を想定しています。

```text
C:\dev\jobstockAI
```
