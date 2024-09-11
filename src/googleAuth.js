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
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * 認証情報を保存する関数
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
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

/**
 * 認証URLを生成する関数
 *
 * @return {string}
 */
function generateAuthUrl() {
  const { client_id, client_secret, redirect_uris } = require(CREDENTIALS_PATH).web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
}

// authorize関数とgenerateAuthUrl関数をエクスポート
module.exports = {
  authorize,
  generateAuthUrl,
};
