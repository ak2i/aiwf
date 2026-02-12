# aiwf Background: CLI Architecture & Pull Model (v0.1.3)

``` yaml
ideamark_version: 1
doc_id: "aiwf.background.cli-architecture.v0.1.3"
doc_type: "background"
status: "draft"
created_at: "2026-02-12"
updated_at: "2026-02-12"
lang: "ja-JP"

project:
  name: aiwf
  repo: "ak2i/aiwf"
  spec_version: "0.1.3"

intent: >
  aiwf を Runner から Workflow OS へ進化させるための
  CLI 再設計および Pull 型モデル確立の背景整理。
```

------------------------------------------------------------------------

## Section 001 : 位置づけ

v0.1.3 は大規模再設計である。\
aiwf を「ツール実行ループ」から「構造と履歴を保持する Workflow
OS」へ昇格させる。

中心思想：

-   aiwf は賢くならない
-   判断は Tool 側に属する
-   aiwf は構造・履歴・再現性を担保する
-   情報取得は Pull 型

------------------------------------------------------------------------

## Section 002 : Pull 型モデル

Tool は以下の順序で動作する：

1.  catalog で目録参照
2.  必要情報を fetch
3.  内部処理
4.  artifact 登録

aiwf は push しない。 常に Tool → aiwf の要求モデルである。

------------------------------------------------------------------------

## Section 003 : catalog / fetch 分離

-   catalog : 一覧・検索専用
-   fetch : 実体取得専用

この分離により：

-   CLI が明確化
-   Responder が安全に探索可能
-   将来のリモート分散に対応可能

------------------------------------------------------------------------

## Section 004 : Material と View モデル

Materials は削除しない。

Material Set により：

-   include
-   exclude

を指定して View を作る。

削除ではなく、参照切替で履歴を守る。

------------------------------------------------------------------------

## Section 005 : Tool Meta の正式化

ツール登録時に以下を保持：

-   request_model (adaptive/deterministic/adapter)
-   compliance
-   execution_environment
-   capabilities

aiwf は解釈しない。記録のみ。

------------------------------------------------------------------------

## Section 006 : 非目標

v0.1.3 では以下を実装しない：

-   完全権限モデル
-   JWT 管理
-   サンドボックス強制
-   リモート同期基盤

------------------------------------------------------------------------

## Section 007 : 将来拡張

-   JWT によるセッション制限
-   リモート aiwf 同期
-   Adapter 実装層
-   分散 Actor モデル

------------------------------------------------------------------------

*End of Background v0.1.3*
