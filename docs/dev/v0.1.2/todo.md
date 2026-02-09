# aiwf v0.1.2 開発計画（TODO）

前提: v0.1.1 の実装をベースに、Participant モデルの差分を反映する。
対象: `docs/dev/v0.1.2/*` の spec と背景ドキュメントに基づく。

## 0. 方針

- [x] 背景は IdeaMark として参照する（仕様ではない）
- [x] Runner-first の責務分離を維持する
- [x] Participant はセッションに対して情報提供する存在

## 1. 仕様の差分確認

- [x] Participant / Responder / Actor の定義を確認
- [x] Session Interaction Rules の制約を確認

## 2. 実装変更

- [x] run.json に `participants` を任意で記録できるようにする
- [x] CLI から Participant を指定できるようにする
- [x] Participant 出力は artifacts に保存する運用を明記

## 3. ドキュメント

- [x] `docs/sessions.md` に Participant の記録方法を追記
- [x] README に `--participant` の例を追加

## 4. テスト

- [x] `--participant` 指定で run.json に反映される

## 5. リリース

- [ ] version を 0.1.2 に更新
- [ ] npm publish / git tag
