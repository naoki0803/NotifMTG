const { IncomingWebhook } = require('@slack/webhook');
const { authorize, generateAuthUrl } = require('./googleAuth.js');
const { google } = require('googleapis');
const dayjs = require('dayjs');
const cron = require('node-cron');
require('dotenv').config();

// SlackのWebhook URLを環境変数から取得
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const webhook = new IncomingWebhook(webhookUrl);

async function toDayMtgNotif() {
  try {
    // authorize関数を使ってOAuth2クライアントを取得
    const auth = await authorize();

    // Google Calendar APIのセットアップ
    const calendar = google.calendar({ version: 'v3', auth });

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
    if (error.message === 'AUTH_REQUIRED') {
      const authUrl = generateAuthUrl();
      await webhook.send({
        text: `Google認証が必要です。以下のURLにアクセスして認証を行ってください：\n${authUrl}`
      });
    } else {
      await webhook.send({
        text: `失敗しました: ${error}`
      });
    }
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
      (async function () {
        try {
          await webhook.send({
            text: `"${event.summary}" が2分後に始まります`
          });
        } catch (error) {
          console.error(`Error sending notification for "${event.summary}":`, error);
        }
      })();
    });
  });
};

toDayMtgNotif();
