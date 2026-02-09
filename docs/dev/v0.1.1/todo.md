# aiwf v0.1.1 開発計画（TODO）

前提: v0.1.0 の実装をベースに、v0.1.1 の仕様差分を反映する。
対象: `docs/dev/v0.1.1/*` の spec と背景ドキュメントに基づく。

## 0. 方針

- [x] 背景は IdeaMark として参照する（仕様ではない）
- [x] Runner-first の責務分離を優先する

## 1. 仕様の差分確認

- [x] v0.1.1 spec の Session / events 要件を確認
- [x] 仕様で定義されたイベント種別を確認

## 2. 実装変更

- [x] `run.json` に `tool`, `argv`, `started_at` を必須で出力
- [x] `spec_stack` を任意で記録できるようにする
- [x] `events.jsonl` に `session_start`, `tool_start`, `artifact_written`, `tool_end` を出力
- [x] 追加イベントは既存の stdout/stderr を壊さず共存させる

## 3. ドキュメント

- [x] `docs/sessions.md` を v0.1.1 のイベント定義に合わせて更新
- [x] README に `--spec-stack` の例を追加

## 4. テスト

- [x] `run.json` が必須フィールドを持つ
- [x] `events.jsonl` が v0.1.1 の最小イベントを含む
