# aiwf Specification v0.1.3

**Version:** 0.1.3\
**Status:** Draft\
**Updated:** 2026-02-12

------------------------------------------------------------------------

# 1. CLI 構造

    aiwf <command> [subcommand] [options]

トップレベルコマンド：

-   session
-   tool
-   material
-   catalog
-   fetch
-   artifact
-   event
-   `<tool-name>`{=html}
-   tool run

------------------------------------------------------------------------

# 2. Session

-   session new
-   session list
-   session attach `<id>`{=html}
-   session detach
-   session archive `<id>`{=html}
-   session remove `<id>`{=html} --hard

------------------------------------------------------------------------

# 3. Tool

-   tool add \<path\|url\>
-   tool delete `<id>`{=html}
-   tool list
-   tool run `<id>`{=html} ...

Tool Meta 必須項目：

-   tool_id
-   invocation_type
-   capabilities
-   request_model
-   compliance
-   execution_environment
-   adapter_required
-   adapter_notes

------------------------------------------------------------------------

# 4. Material

-   material add `<path>`{=html}
-   material set create
-   material set list

Material Set:

-   include
-   exclude

------------------------------------------------------------------------

# 5. Catalog（一覧・検索専用）

    aiwf catalog <kind> [options]

kind:

-   sessions
-   tools
-   materials
-   material-sets
-   artifacts
-   events
-   timeline

共通オプション：

-   --format \<table\|json\|jsonl\>
-   --fields `<csv>`{=html}
-   --limit `<n>`{=html}
-   --offset `<n>`{=html}
-   --sort `<field>`{=html}
-   --order \<asc\|desc\>
-   --query `<string>`{=html}
-   --filter \<key=value\>
-   --since `<ISO8601>`{=html}
-   --until `<ISO8601>`{=html}

materials 追加フィルタ：

-   --type \<file\|text\|url\|artifact\>
-   --tag `<string>`{=html}
-   --source `<string>`{=html}

artifacts 追加フィルタ：

-   --tool `<tool_id>`{=html}
-   --material-set `<id>`{=html}
-   --latest

------------------------------------------------------------------------

# 6. Fetch（実体取得専用）

    aiwf fetch <ref> [options]

ref 形式：

-   material:`<id>`{=html}
-   material-set:`<id>`{=html}
-   artifact:`<id>`{=html}
-   event:`<id>`{=html}
-   tool:`<id>`{=html}

オプション：

-   --out \<path\|-\>
-   --format \<raw\|json\|text\>
-   --pretty

------------------------------------------------------------------------

# 7. Artifact

-   artifact add `<path>`{=html}

必須メタ：

-   material_set_id
-   tool_id
-   tool_version

------------------------------------------------------------------------

# 8. Pull モデル原則

-   Tool が catalog 参照
-   Tool が fetch 実行
-   aiwf は push しない

------------------------------------------------------------------------

# 9. セッション拘束（v0.1.3）

child process 実行時に環境変数でセッションを伝搬：

-   AIWF_SESSION_ID
-   AIWF_SESSION_PATH
-   AIWF_MATERIAL_SET_ID

------------------------------------------------------------------------

# 10. 将来拡張

-   JWT ベース制御
-   Remote session sync
-   Adapter 層
-   Sandbox execution

------------------------------------------------------------------------

*End of aiwf Specification v0.1.3*
