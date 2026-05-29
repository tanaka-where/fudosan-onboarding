# 仕様書 v2：顧客の声 自動構造化パイプライン

> v1（Claude チャット版）からの修正版。田中さん承認済みの方針を反映。
> 実装着手前の **正本**。

## 0. 目的

Google Drive 上の「顧客の声」資料を毎日定期的に差分検知し、業界別×課題別に
要約・分類して、`pages/chapter4-3.html`（3-5 顧客の声）に時系列フィードとして
無人で追加する。

## 1. 確定方針（v1からの変更点ハイライト）

| # | 項目 | v1 | v2（確定） |
|--|--|--|--|
| 1 | **ホスティング** | GitHub Pages（完全パブリック） | **社内限定ホスティングに移設**。Cloudflare Pages + Access (pntwhere.com SSO 限定) |
| 2 | **抽象化レベル** | 個社名・案件・担当者を全て除去 | **社内限定なので原則そのままでOK**。ただし「センシティブ警告」だけはLLMが付ける |
| 3 | **頻度** | 週次想定 | **毎日 JST 23:00**（GitHub Actions cron `0 14 * * *`） |
| 4 | **差分定義** | modifiedTime + hash（更新も拾う） | **初回 = 全件 / 2回目以降 = createdTime > last_run_iso（追加のみ）**。更新は今回スコープ外 |
| 5 | **Page Writer** | 抽象化された Notion or 静的サイト | **voices.json + クライアント fetch**。`pages/chapter4-3.html` がfetchして描画 |
| 6 | **承認フロー** | 無人 | **無人（社内限定移設で機密リスクが下がるため）**。失敗のみ Slack 通知 |
| 7 | **表示順** | 業界×課題マトリクス | **追加日降順のフィード**＋業界・課題でフィルタ |

## 2. 全体アーキテクチャ（v2）

```
[Daily 23:00 JST = UTC 14:00]
GitHub Actions cron
   │
   ▼
1. Diff Detector
   - Drive API で対象フォルダ配下を再帰列挙
   - voices.json の processed_ledger と diff
   - 初回 = 全件 / 2回目以降 = createdTime > last_run_iso のみ
   │
   ▼
2. Extractor
   - Drive nativeはPDF export、PDF/PPTX/DOCXはそのまま取得
   - すべて「PDF として Claude API document block」のパスに統一
   - 抽出文字数が閾値未満なら低品質フラグ→スキップ＋voices.json.skipped にログ
   │
   ▼
3. Structurer（Claude API + taxonomy.yaml）
   - 入力: PDF base64 + taxonomy.yaml + system prompt（要約・分類・センシティブ判定）
   - 出力: JSON エントリ
   │
   ▼
4. Merger
   - voices.json.entries に append
   - processed_ledger に fileId 登録
   - last_run_iso 更新
   │
   ▼
5. Commit & Push
   - GitHub Actions が main に commit-back
   - Cloudflare Pages が自動でビルド & デプロイ
   │
   ▼
6. Slack 通知（成功サマリ or 失敗）
```

## 3. データスキーマ

### 3.1 `assets/data/voices.json`

```json
{
  "schema_version": "v1",
  "last_run_iso": "2026-05-30T14:00:00Z",
  "last_full_sync_iso": "2026-05-29T00:00:00Z",
  "stats": {
    "total_entries": 47,
    "skipped_low_quality": 3,
    "unclassified": 1
  },
  "entries": [
    {
      "id": "uuid-or-fileId",
      "added_at": "2026-05-30T14:05:00+09:00",
      "source_file_id": "1AbC...",
      "source_url": "https://drive.google.com/file/d/1AbC.../view",
      "source_name": "20260528_◯◯ホーム様議事録.pdf",
      "industry": "戸建分譲",
      "issue_category": "オフマーケット未到達",
      "voice_summary": "200〜250字の要約。社内限定なので個社名含めて率直に。",
      "insight": "1〜2文の示唆（任意）",
      "sensitive_flag": false,
      "sensitive_reason": null,
      "confidence": 0.86,
      "new_category_proposed": null,
      "owner_path": "営業/田中/◯◯ホーム/2026Q2"
    }
  ],
  "skipped": [
    {
      "source_file_id": "...",
      "source_name": "...",
      "reason": "low_quality_scan",
      "skipped_at": "..."
    }
  ],
  "processed_ledger": {
    "1AbC...": { "added_at": "...", "content_hash": "sha256..." }
  }
}
```

**フィールド設計のポイント**:
- `added_at`: ページ側ソートキー（追加日降順）
- `source_url`: クリックで Drive 該当ファイルへ。pntwhere.com アカウント前提
- `source_name`: 一覧で「どの資料か」を識別
- `owner_path`: Drive 上のフォルダパス（営業/顧客名/案件など）。検索・フィルタ用
- `sensitive_flag`: LLMが「センシティブかも」と判断したエントリにマーク。社内限定でも気を付けるべき内容（個人の評価・人事情報・未公表M&A等）

### 3.2 `docs/taxonomy.yaml`

`docs/taxonomy.example.yaml` として初期版を別途同梱。中身は chapter2-1 のプレイヤーと chapter3-1 の4課題から流用。

## 4. コンポーネント仕様（v2）

### (A) Scheduler
- **GitHub Actions cron** `0 14 * * *`（UTC = JST 23:00）
- `workflow_dispatch` で手動キックも可
- timeout: 30分
- 同時実行抑止: `concurrency: voice-pipeline`

### (B) Diff Detector
- **初回判定**: `voices.json.last_run_iso` が存在しなければ初回 → 全件処理
- **2回目以降**: Drive API `files.list` で `createdTime > last_run_iso and mimeType in (pdf, gdoc, gslides, docx, pptx) and trashed = false` で絞り込み
- **再帰**: `'{folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'` で全サブフォルダ ID を BFS で展開
- ルート: `1aYjNG2c2NjqHLEaaj3K0n9-3CL_RUtbh`（環境変数で差し替え可能）
- 出力: `[{fileId, name, ownerPath, mimeType, createdTime, viewUrl}]`

### (C) Extractor
- **統一パス**: 全形式 → PDF として Claude API へ
- 変換マトリクス:
  | 入力 MIME | 取得方法 |
  |--|--|
  | application/pdf | `files.get?alt=media` でそのまま |
  | google-apps.document | `files.export?mimeType=application/pdf` |
  | google-apps.presentation | `files.export?mimeType=application/pdf` |
  | docx / pptx | `files.get?alt=media` → LibreOffice headless で PDF 化 |
- 低品質判定: PDF→テキスト抽出（pypdf）で 200 文字未満ならスキャンPDFと判定 → スキップ＋ledger 記録
- Claude API へは `document` ブロック（base64 PDF）で投入

### (D) Structurer（コア・LLM）
- モデル: **Claude Sonnet 4.6** (claude-sonnet-4-6) を既定。コスト重視。
- 入力プロンプト構成:
  1. system: 役割定義、社内限定ホスティングであること、抽象化レベル、taxonomy.yaml の貼り付け、JSON スキーマ
  2. user: PDF document block + メタ（fileName, ownerPath）
- **タクソノミ固定ルール**: industry/issue_category は taxonomy.yaml の値から1つ必ず選ぶ。該当なしのみ `"未分類"` を許可し `new_category_proposed` に候補を入れる
- **センシティブ判定**: 個人の人事・評価、未公表のM&A・財務、捜査・訴訟、医療情報などが含まれる場合 `sensitive_flag: true` + 理由付与
- **抽出条件**: 1ファイルから複数のvoiceを抽出してもよい（議事録など）。複数の場合は JSON 配列で返す

### (E) Merger
- `entries` 末尾に append（重複なし、`processed_ledger` で fileId ベース dedup）
- `processed_ledger` に fileId と content_hash を登録
- `last_run_iso` を today に更新
- `stats` を再計算
- 「未分類」エントリは `entries` に含めるが、ページ側で別タブで表示

### (F) Page Writer = chapter4-3.html クライアント描画
- 既存の手書きSlack引用部分は**そのまま温存**
- 新規セクション「📅 自動追加フィード」を追加
- `<script>` で `assets/data/voices.json` を fetch → クライアント側で描画
- UI:
  - 業界フィルタ（チップ）
  - 課題フィルタ（チップ）
  - 検索ボックス（要約・名前で incremental filter）
  - 各エントリカード: 追加日 / 業界バッジ / 課題バッジ / 要約 / 示唆 / [🔗 元資料を開く（社内Drive）]
  - 「未分類」エントリだけ表示する切替ボタン

### (G) State Store
- `assets/data/voices.json` 自体に内包（last_run_iso、processed_ledger を同居）
- GitHub Actions が commit back（`actions/checkout` + `git push`）
- 別ストアは不要

## 5. 機密性制約（v2、ホスティング層で対処）

**1次防御 = ホスティング**:
- サイト全体を **Cloudflare Pages + Cloudflare Access** で囲う
- Cloudflare Access の IdP は **Google Workspace（pntwhere.com）**
- アクセスポリシー: `email_domain == "pntwhere.com"` のみ許可
- 全 URL（HTML, JSON, アセット）がポリシー対象

**2次防御 = LLM**:
- `sensitive_flag: true` のエントリはページ側でデフォルト非表示、「センシティブを表示」トグルで露出
- 個人名・電話・メアドの簡易NG正規表現でガード（誤抽出防止）

**3次防御 = ledger 監査ログ**:
- 全 run のログを `voices.json.run_log` に最新10件保持（誰がいつ何ファイル追加したか）

## 6. エラーハンドリング / 運用

| 事象 | 挙動 |
|--|--|
| Drive API 失敗 | 指数バックオフ最大3回 → 失敗で run 中断、Slack 通知 |
| Claude API 失敗 | 個別ファイルは skip、ledger に `error` 記録、次 run で再試行 |
| PDF 変換失敗 | skip + skipped 配列に記録、Slack 通知に件数 |
| 全件失敗 | Slack 通知 + workflow_dispatch で手動再実行 |
| ファイル削除 | 月1回の health-check ジョブで `voices.json` 側にも `removed: true` マーク（公開停止） |

## 7. 技術スタック

| レイヤ | 採用 |
|--|--|
| 言語 | Python 3.11 |
| Drive | `google-api-python-client`（drive.readonly） |
| LLM | `anthropic` SDK / Claude Sonnet 4.6 / document block |
| PDF変換 | LibreOffice headless（docx/pptx）、pypdf（品質判定） |
| Scheduler | GitHub Actions cron |
| State | `assets/data/voices.json`（リポジトリ内） |
| 通知 | Slack Incoming Webhook |
| Hosting | **Cloudflare Pages + Cloudflare Access**（GitHub Pages から移設） |
| 認証 | Cloudflare Access + Google Workspace SSO |

## 8. 必要な人手作業（実装着手前）

| # | 作業 | 担当 | 所要 |
|--|--|--|--|
| 1 | GCP プロジェクト作成 + Drive API 有効化 + サービスアカウント作成 + キーJSONダウンロード | 田中 | 10分 |
| 2 | 対象 Drive フォルダ（1aYjNG2c2NjqHLEaaj3K0n9-3CL_RUtbh）をサービスアカウントメアドに「閲覧者」共有 | 田中 | 1分 |
| 3 | Anthropic API キー発行（既存があれば流用） | 田中 | 5分 |
| 4 | Slack Incoming Webhook 作成 + 通知先チャンネル決定 | 田中 | 5分 |
| 5 | Cloudflare アカウント作成、Pages プロジェクト作成（リポジトリ連携） | 田中 | 10分 |
| 6 | Cloudflare Access 設定（Google Workspace IdP、pntwhere.com ドメイン制限） | 田中 | 15分 |
| 7 | `docs/taxonomy.example.yaml` のレビュー＆社内用語に補正 | 田中 | 20分 |
| 8 | GitHub Actions secrets 登録（GCP_SA_JSON / ANTHROPIC_API_KEY / SLACK_WEBHOOK_URL） | 田中 | 5分 |
| 9 | GitHub Pages からの離脱（Slack で URL 変更告知） | 田中 | 10分 |

合計1時間〜1時間半の人手作業。**全部終わったら Claude Code に実装を投げる**。

## 9. 実装フェーズ（Claude Code 側）

| Phase | 内容 |
|--|--|
| P1 | スクリプト本体（`scripts/voice_pipeline.py`）と Actions workflow（`.github/workflows/voice-pipeline.yml`） |
| P2 | `chapter4-3.html` に自動フィード描画ロジック追加（既存セクション温存） |
| P3 | dry-run モード追加（commit せず Slack で「もし実行したら N 件追加でした」） |
| P4 | 初回 full-sync 実行 → 結果レビュー → taxonomy 微調整 |
| P5 | 通常運用開始 |

## 10. オープン論点（今後の判断事項）

| # | 論点 | 候補 |
|--|--|--|
| O1 | GitHub Pages を残すか・閉じるか | 閉じる（URL 統一・混乱回避）／ サイトトップだけリダイレクト |
| O2 | Drive ファイル更新時の追従 | スコープ外（v2.1で追加検討） |
| O3 | 削除されたファイルの履歴扱い | 月1 health-check で `removed: true` マーク、ページ非表示 |
| O4 | センシティブエントリの完全除外 vs トグル表示 | トグル表示（社内員は判断材料が欲しい場面あるはず） |
| O5 | コスト上限 | Anthropic API は月20ドル上限を設定。超えたら通知＆停止 |
| O6 | 既存の手書きSlack引用との関係 | 「📅 自動フィード」セクションを別建てで温存 |

## 11. 想定リスクと対策

| リスク | 確率 | 影響 | 対策 |
|--|--|--|--|
| **Cloudflare Access の社外漏れ** | 低 | 高 | IdP 設定の二重確認、月1回のアクセスログ監査 |
| **LLM がセンシティブ判定を見落とし** | 中 | 中 | `sensitive_flag` 全件目視チェックの初月運用 |
| **タクソノミドリフト** | 高 | 中 | `new_category_proposed` を毎月集約 → taxonomy.yaml に取り込み |
| **GitHub Actions cron 遅延・スキップ** | 中 | 低 | 翌日 run で自動回収（冪等設計） |
| **Drive API クォータ超過** | 低 | 中 | バックオフ + 月次クォータ監視 |
| **APIコスト膨張** | 低 | 中 | 月予算アラート、文字数閾値で巨大PDFは要約前カット |
| **Cloudflare無料枠超過** | 極低 | 低 | 50ユーザーまで無料、Workers Paid で月$5 |

---

**仕様書 v2 ここまで。** 次は §8 の人手作業を進めるところから。
