#!/bin/bash

# ファイル名: script.sh
# 
# 概要: crontabで登録した実行日時(平日のAM8:40に実行)に notifMTG.js を実行する為のスクリプト
# crontabの内容: 
# 45 8 * * 1-5 /bin/zsh -c 'source ~/projects/notifMTG/script.sh' >> ~/projects/notifMTG/logs/cron.log 2>&1
#
# 作成者: 00083ns
# 作成日: 2024/08/25
# 更新者: 
# 更新日: 

# Slackが起動していない場合、Slackを起動
if ! pgrep -x "Slack" > /dev/null; then
  echo "Starting Slack..."
  open -a "Slack"  # Slackを起動
  sleep 5 # 完全に起動するまで少し待つ
fi

# プロセスを停止（前日のプロセスを終了）
pid=$(ps aux | grep 'src/notifMTG.js' | grep -v grep | awk '{print $2}')

if [ -n "$pid" ]; then
  kill "$pid"
  echo "Stopped process: $pid"
fi

cd ~/projects/notifMTG

# mtgNotifをバックグラウンドで実行
/opt/homebrew/bin/node ~/projects/notifMTG/src/notifMTG.js &