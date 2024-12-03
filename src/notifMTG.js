/**
 * ファイル名: notifMTG.js.js
 * 
 * 概要: Googleカレンダーに登録されている予定を取得し、Slackに通知するプログラム 
 * 詳細:
 * 1. cronで設定した時刻に定期実行する
 * 2. 平日の朝に当日のMTG予定を取得する
 * 3. 1で取得したMTGの開始2分前にcronによる再通知を実施する
 * ※ Slackへの通知は、SlackWebhookを利用して通知している
 * ※ GoogleカレンダーはOAuth2を利用して取得している
 * * 
 * 前提条件:
 * - SlackのWebhookURLを取得し.envファイルに記述している
 * - GoogleカレンダーのIDを取得し.envファイルに記述している
 * - OAuth2認証に必要なcredentials.jsonの値が記述されている 
 * 
 * 作成者: 00083ns
 * 作成日: 2024/08/25
 * 更新者: 
 * 更新日: 
 */

const { IncomingWebhook } = require('@slack/webhook');
const { authorize } = require('./googleAuth.js');
const { google } = require('googleapis');
const dayjs = require('dayjs');
const cron = require('node-cron');

require('dotenv').config();

// SlackのWebhook URLを環境変数から取得
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const webhook = new IncomingWebhook(webhookUrl);

// Google Calendar APIからイベント(Schedule)を取得する関数
async function fetchTodayMtgSchedules() {
    try {
        // googleAuth.jsからexportしたauthorize関数を使ってOAuth2クライアントを取得
        const auth = await authorize();

        // Google Calendar APIのセットアップ
        const calendar = google.calendar({ version: 'v3', auth });

        // 今日の日付を設定
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString(); // eslint-disable-line no-magic-numbers

        // Google Calendar APIからイベント(Schedule)の取得
        const response = await calendar.events.list({
            calendarId: process.env.CALENDAR_ID,
            timeMin: startOfDay,
            timeMax: endOfDay,
            singleEvents: true,
            orderBy: 'startTime',
        });
        // イベント(Schedule)の整形
        const events = response.data.items;
        const result = events.map(event => ({
            summary: event.summary,
            dateTime: new Date(event.start.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), // 日本時間に変換
            URL: event.description ? event.description : 'URLなし' //URLの追加
        }));
        return result;
    } catch (error) {
        // console.log(`スケジュールの取得に失敗しました: ${error}`);  // eslint-disable-line no-console
        await webhook.send({  // エラーメッセージをSlackに送信
            text: `スケジュールの取得に失敗しました: ${error}`
        });
        return false;
    }
}

// Slackに通知する関数
async function sendMtgNotification(events) {
    try {
        // result(Scheduleの内容)を整形して、Slackに通知
        if (events.length) {
            const formattedEvents = events.map(event => `\t･ ${event.dateTime} - ${event.summary} (${event.URL})`).join('\n');
            await webhook.send({
                text: `【本日のMTG予定】\n${formattedEvents}`
            });

            // Reminderの設定
            scheduleReminder(events);

        } else {
            await webhook.send({
                text: '【本日のMTG予定】\n 本日MTGの予定はありません'
            });
        }
    } catch (error) {
        await webhook.send({
            text: `通知送信中にエラーが発生しました: ${error}`
        });
    }
}

// 指定された会議のn分前に通知する関数
function scheduleReminder(events) {
    events.forEach(event => {
        const today = dayjs().format('YYYY-MM-DD'); // 今日の日付を取得
        const eventDateTime = `${today} ${event.dateTime}`; // 今日の日付に時間を結合
        const eventTime = dayjs(eventDateTime, 'YYYY-MM-DD HH:mm'); // 結果をdayjsオブジェクトに変換
        const reminderMinutes = 2;  // 会議の何分前に通知するかを変数に格納
        const notifyTime = eventTime.subtract(reminderMinutes, 'minute'); // 通知する時間を計算
        const cronTime = `${notifyTime.minute()} ${notifyTime.hour()} * * *`; // cron時間を設定

        cron.schedule(cronTime, () => {
            // 非同期即時実行関数(IIFE)を使って、非同期処理をその場で実行
            (async function () {
                try {
                    // 非同期処理を行う（例: Slackへのメッセージ送信）
                    await webhook.send({
                        text: `"${event.summary}" が2分後に始まります \n ${event.URL}`
                    });
                } catch {
                    await webhook.send({
                        text: `Reminder送信中にエラーが発生しました: "${event.summary}"`
                    });
                }
            })(); // ここで関数を定義すると同時に実行している
        });
    });
};

// toDayMtgNotif関数をリファクタリング
async function toDayMtgNotif() {
    try {
        const events = await fetchTodayMtgSchedules();
        if (!events) { // エラーが発生した場合は処理を終了
            return; // 何も送信しない
        }
        await sendMtgNotification(events);
    } catch (error) {
        await webhook.send({
            text: `toDayMtgNotifの実行に失敗しました: ${error}`
        });
    }
}

toDayMtgNotif();