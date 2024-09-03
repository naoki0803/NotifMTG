/**
 * ファイル名: mtgNotif.js
 * 
 * 概要: cronによる適期実行で、Googleカレンダーに登録されている予定を取得し、Slackに通知するプログラム 
 * 詳細:
 * 1. cronの定期実行により毎朝9時に実行される
 * 2. 毎朝9時に当日のMTG予定を取得する
 * 3. 1で取得したMTGの開始2分前にcronによる再通知を実施する
 * ※ Slackへの通知は、SlackWebhookを利用して通知している
 * ※ GoogleカレンダーはOAuth2を利用して取得している
 * * 
 * 前提条件:
 * - SlackのWebhookURLを取得している
 * - OAuth2のID,SECRET,REFRESH_TOKENを取得している
 * - GoogleカレンダーのIDを取得している
 * - 取得した情報を.envファイルに記述している
 * 
 * 作成者: 00083ns
 * 作成日: 2024/08/25
 * 更新者: 
 * 更新日: 
 */

const { IncomingWebhook } = require('@slack/webhook');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const dayjs = require('dayjs');
const cron = require('node-cron');
require('dotenv').config()

// SlackのWebhook URLを環境変数から取得
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
// console.log(webhookUrl);
const webhook = new IncomingWebhook(webhookUrl);

async function toDayMtgNotif(event) {
  try {
    // OAuth2クライアントの設定
    const oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // console.log("oauth2Client", oauth2Client);

    // アクセストークンの設定
    oauth2Client.setCredentials({
      refresh_token: process.env.ENCRYPT_GOOGLE_REFRESH_TOKEN
    });

    console.log(1);
    // Google Calendar APIのセットアップ
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    console.log(calendar);
    // 今日の日付を取得
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // イベント(Schedule)の取得
    const response = await calendar.events.list({
      calendarId: process.env.ITECS_CALENDAR_ID,
      timeMin: startOfDay,
      timeMax: endOfDay,
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log(response);

    // // カレンダーリストの取得
    // const calendarListResponse = await calendar.calendarList.list();
    // const calendarList = calendarListResponse.data.items;

    // // Calendarリストをログに表示
    // console.log("calendarList:", calendarList);

    // // カレンダー ID をログに表示
    // const calendarIds = calendarList.map(cal => cal.id);
    // console.log("Calendar IDs:", calendarIds);


    // 取得したイベント(Schedule)が配列担っているので、mapで必要情報だけをresultに格納
    const events = response.data.items;
    const result = events.map(event => ({
      summary: event.summary,
      dateTime: new Date(event.start.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) // 日本時間に変換
    }));

    // result(Scheduleの内容)を整形して、Slackに通知
    if (result.length) {
      const formattedEvents = result.map(event => `\t･ ${event.dateTime} - ${event.summary}`).join('\n');
      await webhook.send({
        text: `【本日のMTG予定】\n${formattedEvents}`
      });

      // Reminderの設定
      scheduleReminder(result);

    } else {
      await webhook.send({
        text: `【本日のMTG予定】\n 本日MTGの予定はありません`
      });
    }

  } catch (error) {
    await webhook.send({
      text: `失敗しました: ${error}`
    });
  }
}

// 指定された会議の2分前に通知する関数
function scheduleReminder(events) {
  events.forEach(event => {
    const today = dayjs().format('YYYY-MM-DD'); // 今日の日付を取得
    const eventDateTime = `${today} ${event.dateTime}`; // 今日の日付に時間を結合
    const eventTime = dayjs(eventDateTime, 'YYYY-MM-DD HH:mm');
    const notifyTime = eventTime.subtract(2, 'minute');
    const cronTime = `${notifyTime.minute()} ${notifyTime.hour()} * * *`;

    cron.schedule(cronTime, () => {
      // 非同期即時実行関数(IIFE)を使って、非同期処理をその場で実行
      (async function () {
        try {
          // 非同期処理を行う（例: Slackへのメッセージ送信）
          await webhook.send({
            text: `"${event.summary}" が2分後に始まります`
          });
        } catch (error) {
          // エラーが発生した場合の処理
          console.error(`Error sending notification for "${event.summary}":`, error);
        }
      })(); // ();
      ここで関数を定義すると同時に実行している
    });
  });
};

toDayMtgNotif();