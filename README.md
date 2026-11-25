# 聖誕易圖洽辦公室市集

易圖 12/22–24 辦公室二手市集，以及 12/21 集團 ESG 二手好物市集的好物登記、選品清冊。

- 網站：https://nigel609132-cmyk.github.io/xmas-market/
- 純前端，放在 GitHub Pages；資料放 Firebase（Firestore、Realtime Database），登入用公司 Google 帳號（@gis.fcu.edu.tw、@geosense.tw 或 @easymap.tw）。

## 權限

| 頁面 | 誰可以用 |
| --- | --- |
| 活動介紹、空間地圖、逛賣場 | 所有人（不用登入） |
| 我要上架、好物登記、我有興趣 | 用 @gis.fcu.edu.tw、@geosense.tw 或 @easymap.tw 帳號登入的同仁 |
| 座位綁定 | 同仁第一次進「我要上架」時自己選座位，選了就鎖定；管理員可在選品清冊頁解除 |
| 選品清冊、Excel 匯出、管理員選入 | 管理員（名單放在 Firestore `config/admins`） |

## 檔案

- `index.html`：整個網站（2.5D 樓層地圖、逛賣場、上架、好物登記、選品清冊）
- `js/config.js`：Firebase 設定、登入網域
- `js/cloud.js`：Firebase 資料同步、登入、我有興趣、即時在線
- `js/office3d.js`：點進辦公室後的 3D 微縮模型（three.js）
- `firestore.rules`、`database.rules.json`：安全規則
- `functions/`：有人按「我有興趣」時自動寄 Email 給賣家（需要 Blaze 方案）

`js/config.js` 裡的 `firebase` 改成 `null` 時，網站會變成本機模式：資料只存在各自的瀏覽器，跟原型一樣，方便離線展示。

## 第一次設定（Firebase 主控台）

1. **Firestore**：建立資料庫（地區選 `asia-east1`），然後到「規則」分頁，把 `firestore.rules` 的內容整段貼上並發布。
2. **管理員名單**：在 Firestore 新增集合 `config`，文件 ID 填 `admins`，加一個欄位 `emails`（類型：array），內容放管理員信箱（小寫），例如 `nigelwang@gis.fcu.edu.tw`。
3. **登入**：Authentication → Sign-in method → 啟用 Google。再到 Authentication → 設定 → 授權網域，新增 `nigel609132-cmyk.github.io`。
4. **即時在線小人**：Realtime Database → 建立資料庫（地區選新加坡 `asia-southeast1`，以鎖定模式開始）。到「規則」分頁貼上 `database.rules.json` 的內容。再把資料庫網址（`https://…firebasedatabase.app`）填到 `js/config.js` 的 `databaseURL`。
5. **自動寄信（選用）**：專案升級 Blaze 方案後，用 Firebase CLI 執行：
   ```
   firebase functions:secrets:set SMTP_USER   # 寄件用的公司 Gmail 帳號
   firebase functions:secrets:set SMTP_PASS   # 該帳號的應用程式密碼
   firebase deploy --only functions
   ```

## GitHub Pages

Settings → Pages → Source 選「Deploy from a branch」，Branch 選 `main`、資料夾 `/ (root)`。
