// 有人按「我有興趣」時，自動寄 Email 給賣家。
// 需要 Firebase Blaze 方案，並設定兩個 Secret：
//   firebase functions:secrets:set SMTP_USER   （寄件用的公司 Gmail 帳號）
//   firebase functions:secrets:set SMTP_PASS   （該帳號的「應用程式密碼」）
const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {defineSecret} = require('firebase-functions/params');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

initializeApp();
const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');
const SITE = 'https://nigel609132-cmyk.github.io/xmas-market/';

exports.notifySeller = onDocumentCreated(
  {document: 'interests/{id}', region: 'asia-east1', secrets: [SMTP_USER, SMTP_PASS]},
  async event => {
    const it = event.data.data();
    // 賣家信箱以伺服器上的商品資料為準，不信任前端送來的值
    const item = (await getFirestore().doc('items/' + it.itemId).get()).data();
    if (!item || !item.sellerEmail || item.sellerUid === it.uid) return;
    const who = it.name || it.email;
    const mail = nodemailer.createTransport({service: 'gmail', auth: {user: SMTP_USER.value(), pass: SMTP_PASS.value()}});
    await mail.sendMail({
      from: `聖誕易圖洽辦公室市集 <${SMTP_USER.value()}>`,
      to: item.sellerEmail,
      replyTo: it.email,
      subject: `🎄 ${who} 對你的「${item.title}」有興趣`,
      text: `${item.seller} 你好：\n\n${who}（${it.email}）對你在聖誕易圖洽辦公室市集上架的「${item.title}」有興趣。\n直接回覆這封信就能聯絡對方，或在 Teams 上找他聊聊。\n\n市集網址：${SITE}#sell\n`,
    });
  });
