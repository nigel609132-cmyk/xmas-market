// 集團ESG x 易圖二手交換市集：正式版設定
// 把 firebase 改成 null 時，網站會用「本機模式」（資料只存在各自的瀏覽器，跟原型一樣）。
// 填入 Firebase 主控台的 firebaseConfig 後，就會改用 Firebase 雲端資料庫與登入。
window.APP_CONFIG = {
  // Firebase 網頁設定（可以公開，安全性靠 firestore.rules / database.rules.json 控制）
  firebase: {
    apiKey: "AIzaSyAhr_UMXfhdeAcA2dCXi5afhMkR-s8w1gE",
    authDomain: "xmas-market-d4c19.firebaseapp.com",
    // Realtime Database（即時在線小人）
    databaseURL: "https://xmas-market-d4c19-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "xmas-market-d4c19",
    storageBucket: "xmas-market-d4c19.firebasestorage.app",
    messagingSenderId: "434275813896",
    appId: "1:434275813896:web:f536fe2292a36b93a89fbd"
  },
  auth: {
    provider: "google",   // "google" 或 "microsoft"（公司用 Microsoft 365 時）
    tenant: "",           // provider 為 microsoft 時，填公司的 Azure 租用戶 ID（可留空）
    domains: ["gis.fcu.edu.tw", "geosense.tw", "easymap.tw"]  // 只允許這些網域的信箱登入；空陣列代表不限制
  }
};
