#!/bin/bash

# ファイル名: script.sh
# 
# 概要: crontabで登録した実行日時(平日のAM8:40に実行)に mtgNotif.js を実行する為のスクリプト
# crontabの内容: 40 8 * * 1-5 /Users/shiratorinaoki/projects/NotifMTG/src/script.sh
#
# 作成者: 00083ns
# 作成日: 2024/08/25
# 更新者: 
# 更新日: 
#

# プロセスを停止(前日のプロセスをここで終了させる)
kill $(ps aux | grep 'src/mtgNotif.js' | grep -v grep | awk '{print $2}')

# mtgNotifをバックグラウンドで実行
node ~/projects/NotifMTG/src/mtgNotif.js &