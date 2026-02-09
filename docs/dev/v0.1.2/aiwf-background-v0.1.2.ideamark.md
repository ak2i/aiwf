```yaml
ideamark_version: 1
doc_id: "aiwf.background.participants.v0.1.2"
doc_type: "derived"
status: "draft"
created_at: "2026-02-09"
updated_at: "2026-02-09"
lang: "ja-JP"
```
# aiwf v0.1.2 背景整理  
## ― Responder / Actor による参加モデル ―

本ドキュメントは、aiwf v0.1.2 において導入される **Participant（参加者）モデル**について、
その設計背景・判断理由・将来展望を整理する IdeaMark document である。

---

## Meta
```yaml
intent: >
  aiwf を人間・LLM・AIエージェントの協調作業ハブとして拡張するために、
  参加者の関与形態を明示的にモデル化する。
domain:
  - aiwf
  - participant
  - responder
  - actor
```
---

## Section 001 : 問題意識

```yaml
section_id: "SEC-001"
anchorage:
  view: "problem"
  phase: "confirmed"
```
aiwf v0.1.1 までは、ツール実行とセッション記録に焦点を当てていた。
しかし FlowMark などの実証実験を進める中で、
LLM や自律的な AI が「どのように」セッションへ関与するかが暗黙的になっていた。

この暗黙性は、複数 AI・複数人間による協調作業を想定した場合に
設計上の曖昧さを生む。

---

## Section 002 : Participant 導入の判断

```yaml
section_id: "SEC-002"
anchorage:
  view: "decision"
  phase: "confirmed"
```
aiwf v0.1.2 では、セッションへの関与主体を **Participant** として抽象化する。

Participant は「実行主体」ではない。
あくまで **セッションに対して情報を与え、意思決定や作業を促す存在**である。

---

## Section 003 : Responder

```yaml
section_id: "SEC-003"
anchorage:
  view: "definition"
  phase: "confirmed"
```
Responder は、要求に応じて応答する参加者である。

- 計画立案
- 評価・レビュー
- 生成（FlowMark / IdeaMark 文書など）

を担当するが、**自らツールを実行しない**。

LLM は原則として Responder として参加する。

---

## Section 004 : Actor

```yaml
section_id: "SEC-004"
anchorage:
  view: "definition"
  phase: "confirmed"
```
Actor は、セッションの状態を観測し、
必要に応じてツール実行や次アクションを自律的に行う参加者である。

Actor は人間でも AI でもよい。

v0.1.2 では Actor は将来拡張として位置付けられる。

---

## Section 005 : Git に類似した分散協調モデル

```yaml
section_id: "SEC-005"
anchorage:
  view: "analogy"
  phase: "confirmed"
```
各 aiwf はローカルにセッションを保持し、
必要に応じて上位の aiwf セッションへ情報を push する。

- 全イベントを同期しない
- 結論・進捗・根拠を選択的に共有する

このモデルは Git の分散協調構造に着想を得ている。

---

*IdeaMark document — aiwf Project*
