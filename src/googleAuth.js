/**
 * ファイル名: googleAuth.js
 * 
 * 概要: Calendar APIを使用するための認証処理を実装(以下クイックスタートのsampleと同一内容)
 *      https://developers.google.com/calendar/api/quickstart/nodejs?hl=ja
 * 詳細:
 *      1. 認証情報の読み込み: 保存された認証情報をファイルから読み込み、OAuth2クライアントを生成します。
 *      2. 認証情報の保存: 新しい認証情報を取得した際に、それをファイルに保存します。
 *      3. API認証の実行: 認証情報が存在しない場合は、ユーザーに認証を促し、取得した認証情報を保存します。
 * 
 * 作成者: 00083ns
 * 作成日: 2024/08/25
 * 更新者: 
 * 更新日: 
 */

const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const { Console } = require('console');

// スコープの設定
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * 保存された認証情報を読み込む関数
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    // トークンファイルを読み込む
    const content = await fs.readFile(TOKEN_PATH);
    // 読み込んだ内容をJSONとして解析
    const credentials = JSON.parse(content);
    // Googleの認証オブジェクトを生成
    const res = google.auth.fromJSON(credentials);
    return res; // 認証オブジェクトを返す
  } catch (err) {
    return null; // エラーが発生した場合はnullを返す
  }
}

/**
 * 認証情報を保存する関数
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  console.log('client', client);
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * APIを呼び出すための認証を行う関数
 *
 * @return {Promise<OAuth2Client>}
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  try {
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  } catch (error) {
    throw new Error('AUTH_REQUIRED');
  }
}

// authorize関数とgenerateAuthUrl関数をエクスポート
module.exports = {
  authorize
};
