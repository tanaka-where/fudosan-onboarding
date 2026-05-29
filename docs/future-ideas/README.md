# Future Ideas（将来検討アイデアの保管庫）

ここは「議論はしたが、今は実装しない」案件のドキュメントを保管する場所。
ゼロから議論し直さなくていいように、検討の過程と仕様を残しておく。

## 一覧

### auto-voice-pipeline.md / taxonomy.example.yaml

**何**: Google Drive 上の「顧客の声」資料を毎日定期的に Anthropic API で要約し、
業界×課題別に分類してページに自動追加するパイプラインの仕様書 v2 と
タクソノミ初期版。

**現状**: 2026-05-29 時点で **見送り**。理由:
- Anthropic API 従量課金が発生（月 $5-10 想定）。Claude.ai サブスクとは別物
- 田中さん退職時にサイト全体が停止する持続性リスク
- 上記2点に対する社内承認・法人契約の手間と、得られる効果のバランス

**代替**: `chapter4-3.html` に「📅 顧客の声フィード」セクションを実装し、
`assets/data/voices.json` に**半手動でエントリ追加する運用**に切り替えた
（Claude Code に「これ載せて」と依頼 → JSON 追加 → commit → push）。

**再開する場合**: voices.json のスキーマは仕様書 v2 と互換にしてあるので、
データはそのまま。スクリプト本体（`scripts/voice_pipeline.py`）と
GitHub Actions workflow を新規実装すれば、既存データを温存したまま
自動化に移行できる。

**再開検討タイミング**:
- 法人契約の Anthropic API が WHERE で結ばれた
- サイトの社内限定移設（Cloudflare Access）が別件で完了した
- 田中さん以外の運用担当者が立った
