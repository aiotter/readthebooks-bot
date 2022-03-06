# readthebooks-bot

[**輪読会会場**](https://discord.gg/U3ADkMG)用の役職管理Botです。

## 使い方
`/role` コマンドで自分に対して追加/削除したい役職を選択してください。
[roles.json](./roles.json) に登録された役職のみ追加/削除ができます。

操作できる役職を追加したい場合は roles.json に対して Pull Request を行なってください。

## 実装メモ
実行環境は Deno Deploy です。
エンドポイントは `main.ts` です。
Bot の token を BOT_TOKEN 環境変数に格納してください。
