# readthebooks-bot

[**輪読会会場**](https://discord.gg/U3ADkMG)用の役職管理Botです。

## 使い方
`/role` コマンドで自分に対して追加/削除したい役職を選択してください。
Bot が権限的に追加/削除可能な役職のみ操作できます。

## 実装メモ
実行環境は Deno Deploy です。
エンドポイントは `main.ts` です。
[.env.sample](./.env.sample) を参考に環境変数の設定を行ってください。
