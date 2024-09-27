# Google Calendar 連携と Slack 通知で実現する自動 MTG リマインダーシステム

## 概要

このプロジェクトは、Google Calendar に登録されているミーティング（MTG）予定を自動的に取得し、Slack に通知するシステムです。当日の MTG 予定を通知し、さらに各 MTG の開始 2 分前に個別の通知を行います。

詳細はZennをご確認ください。

## 主な機能

1. Google Calendar からの当日の MTG 予定取得
2. Slack への当日の MTG 一覧通知
3. 各 MTG の開始 2 分前のリマインダー通知

## 技術スタック

-   Node.js
-   Google Calendar API
-   Slack Webhook
-   OAuth2 認証

## セットアップ手順

1. リポジトリをクローンする

    ```
    git clone [リポジトリURL]
    cd [プロジェクトディレクトリ]
    ```

2. 必要なパッケージをインストールする

    ```
    npm install
    ```

3. Google Cloud Platform でプロジェクトを作成し、Calendar API を有効にする

4. OAuth2.0 クライアント ID を作成し、credentials.json としてプロジェクトルートに保存する

5. Slack で新しい Webhook を作成する

6. .env ファイルを更新する
    ```
    SLACK_WEBHOOK_URL=あなたのSlack Webhook URL
    ITECS_CALENDAR_ID=あなたのGoogle CalendarのID
    ```

7. 初回実行時に認証を行う
    ```
    node mtgNotif.js
    ```
    表示される URL にアクセスし、認証を完了させてください。

## 使用方法

システムを定期実行するには、cron などのスケジューラを使用してください。例えば：

```
0 9 * * 1-5 /usr/bin/node /path/to/your/project/mtgNotif.js
```

これにより、月〜金の朝 9 時に自動実行されます。

## 注意事項

-   このシステムは Node.js v14 以上で動作確認しています。
-   Google Calendar API の利用制限に注意してください。

## コントリビューション

バグ報告や機能改善の提案は、Issue を作成してください。プルリクエストも歓迎します。

## 作者

00083ns
