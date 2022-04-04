# readthebooks-bot

[**輪読会会場**](https://discord.gg/U3ADkMG)用の役職管理Botです。

## 機能
### 役職の追加・削除
`/role` コマンドで自分に対して追加/削除したい役職を選択してください。
Bot が権限的に追加/削除可能な役職のみ操作できます。

### スレッドの維持
THREADS_CATEGORY 環境変数で指定されたカテゴリ内の全チャンネルに対して、スレッドのアーカイブを防ぎます。
ただし約 2 週間書き込みがないものはアーカイブされます。

### イベントの自動作成
[create-event.yml](./github/workflows/create-event.yml) の `jobs.create_event.strategy.matrix.include` を編集することで、定期的にイベントを自動作成できます。

* **name**: イベントの名前
* **start**: 開始時刻 (date -d で解釈可能である必要があります)
* **end**: 終了時刻
* **location**: 開催場所
* **on**: イベント作成のタイミング (cron の書式)。 `on.schedule` にも同じ書式を指定してください。
* **announce-to**: イベント作成後に通知を投稿するテキストチャンネルの ID

イベントの自動作成を行いたい場合は `create-event.yml` に PR を行ってください。

## 実装メモ
実行環境は Deno Deploy です。
エンドポイントは `main.ts` です。
[.env.sample](./.env.sample) を参考に環境変数の設定を行ってください。
