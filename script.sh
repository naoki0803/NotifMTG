#!/bin/bash

# .env ファイルを読み込む
export $(grep -v '^#' .env | xargs)

# プロセスを停止
kill $(ps aux | grep 'src/mtgNotif.js' | grep -v grep | awk '{print $2}')

# 環境変数を使用してノードスクリプトを実行
node ${MY_PROJECTS_DIR}/src/mtgNotif.js &