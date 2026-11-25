// Firebase 雲端資料層：只有 APP_CONFIG.firebase 有填時才會載入。
// 主程式（index.html）的資料仍放在記憶體陣列，這裡負責：
//   1. 把 Firestore 的資料即時同步進來（onSnapshot → MKT.setXxx）
//   2. 主程式呼叫 save()/gsave() 時，找出有變動的文件寫回 Firestore
//   3. 登入、管理員判斷、我有興趣、即時在線（Realtime Database）
const V = '11.0.2', U = n => `https://www.gstatic.com/firebasejs/${V}/firebase-${n}.js`;
const [{initializeApp}, A, F, R] = await Promise.all([U('app'), U('auth'), U('firestore'), U('database')].map(u => import(u)));

const C = window.APP_CONFIG, M = window.MKT;
const app = initializeApp(C.firebase);
const auth = A.getAuth(app), db = F.getFirestore(app);
const rtdb = C.firebase.databaseURL ? R.getDatabase(app) : null;

let user = null, isAdmin = false;
const DOMAINS = (C.auth.domains || (C.auth.domain ? [C.auth.domain] : [])).map(d => d.toLowerCase());
const domainOK = e => !DOMAINS.length || DOMAINS.includes(String(e || '').toLowerCase().split('@')[1]);
const warn = e => console.warn(e);
const fail = e => { console.error(e); M.toast(e && e.code === 'permission-denied' ? '沒有權限做這個動作。' : '儲存失敗，請稍後再試。'); };

/* ---------- 穩定的 JSON（key 排序），用來比對有沒有變動 ---------- */
const clean = (o, drop = []) => { const x = JSON.parse(JSON.stringify(o)); for (const k of drop) delete x[k]; return x; };
const stable = v => Array.isArray(v) ? '[' + v.map(stable).join(',') + ']' :
  v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}' : JSON.stringify(v);

/* ---------- 登入 ---------- */
function provider() {
  if (C.auth.provider === 'microsoft') {
    const p = new A.OAuthProvider('microsoft.com');
    p.setCustomParameters(Object.assign({prompt: 'select_account'}, C.auth.tenant ? {tenant: C.auth.tenant} : {}));
    return p;
  }
  const p = new A.GoogleAuthProvider();
  p.setCustomParameters(Object.assign({prompt: 'select_account'}, DOMAINS.length === 1 ? {hd: DOMAINS[0]} : {}));
  return p;
}
async function login() {
  try {
    const r = await A.signInWithPopup(auth, provider());
    if (!domainOK(r.user.email)) { await A.signOut(auth); M.toast('請用公司信箱（' + DOMAINS.map(d => '@' + d).join(' 或 ') + '）登入。'); }
  } catch (e) { if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') M.toast('登入失敗：' + (e.code || e.message)); }
}
const logout = () => A.signOut(auth);

/* ---------- 易圖上架 items（公開可讀） ---------- */
let rItems = {};
F.onSnapshot(F.collection(db, 'items'), snap => {
  const arr = []; rItems = {};
  snap.forEach(d => { const x = d.data(); x.id = d.id; rItems[d.id] = stable(clean(x, ['id'])); arr.push(x); });
  arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  M.setItems(arr);
}, warn);
function saveItems(items) {
  if (!user) return M.toast('請先登入。');
  const ids = new Set();
  for (const it of items) {
    if (it.demo) continue; ids.add(it.id);
    if (!it.sellerUid) Object.assign(it, {sellerUid: user.uid, sellerEmail: user.email, createdAt: Date.now()});
    const x = clean(it, ['id', 'mine']), j = stable(x);
    if (rItems[it.id] !== j) { rItems[it.id] = j; F.setDoc(F.doc(db, 'items', it.id), x).catch(fail); }
  }
  for (const id in rItems) if (!ids.has(id)) { delete rItems[id]; F.deleteDoc(F.doc(db, 'items', id)).catch(fail); }
}

/* ---------- 座位名字 seats（公開可讀） ---------- */
F.onSnapshot(F.collection(db, 'seats'), snap => {
  const m = {}; snap.forEach(d => { if (d.data().name) m[d.id] = d.data().name; }); M.setNames(m);
}, warn);
const saveName = (seat, name) => user && F.setDoc(F.doc(db, 'seats', seat), {name, by: user.uid, t: Date.now()}).catch(fail);

/* ---------- 集團好物登記 group（登入後可讀，寫入限本人或管理員） ---------- */
let rGroup = {}, rMeta = '', unsubs = [];
function subGroup() {
  unsubs.push(F.onSnapshot(F.collection(db, 'group'), snap => {
    const arr = []; rGroup = {};
    snap.forEach(d => { const x = d.data(); x.id = d.id; rGroup[d.id] = stable(clean(x, ['id'])); arr.push(x); });
    M.setGroup(arr, null);
  }, fail));
  unsubs.push(F.onSnapshot(F.doc(db, 'meta', 'group'), d => { const m = d.exists() ? d.data() : {}; rMeta = stable(m); M.setGroup(null, m); }, () => {}));
}
function saveGroup(GS) {
  if (!user) return M.toast('請先登入。');
  const ids = new Set();
  for (const it of GS.items) {
    ids.add(it.id);
    if (!it.ownerUid) Object.assign(it, {ownerUid: user.uid, ownerEmail: user.email});
    const x = clean(it, ['id']), j = stable(x);
    if (rGroup[it.id] !== j) { rGroup[it.id] = j; F.setDoc(F.doc(db, 'group', it.id), x).catch(fail); }
  }
  for (const id in rGroup) if (!ids.has(id)) { delete rGroup[id]; F.deleteDoc(F.doc(db, 'group', id)).catch(fail); }
  const m = clean(GS.meta || {}), mj = stable(m);
  if (isAdmin && mj !== rMeta) { rMeta = mj; F.setDoc(F.doc(db, 'meta', 'group'), m).catch(fail); }
}

/* ---------- 座位綁定：users/{uid} 記自己的座位，seatClaims/{seat} 保證一個座位只綁一人 ---------- */
function subSeat() {
  unsubs.push(F.onSnapshot(F.doc(db, 'users', user.uid), d => M.setMySeat(d.exists() ? d.data() : null), e => { warn(e); M.setMySeat(null); }));
  unsubs.push(F.onSnapshot(F.collection(db, 'seatClaims'), snap => { const m = {}; snap.forEach(d => m[d.id] = d.data()); M.setClaims(m); }, warn));
}
async function claimSeat(seat, name) {
  if (!user) return false;
  try {
    const b = F.writeBatch(db), t = Date.now();
    b.set(F.doc(db, 'users', user.uid), {seat, name, email: user.email, t});
    b.set(F.doc(db, 'seatClaims', seat), {uid: user.uid, name, email: user.email, t});
    b.set(F.doc(db, 'seats', seat), {name, by: user.uid, t});
    await b.commit(); return true;
  } catch (e) { fail(e); return false; }
}
async function unclaimSeat(seat, uid) {
  try { const b = F.writeBatch(db); b.delete(F.doc(db, 'seatClaims', seat)); if (uid) b.delete(F.doc(db, 'users', uid)); await b.commit(); return true; }
  catch (e) { fail(e); return false; }
}

/* ---------- 我有興趣 interests ---------- */
let mine = new Set(), onMine = {};
function subInterests() {
  unsubs.push(F.onSnapshot(F.query(F.collection(db, 'interests'), F.where('uid', '==', user.uid)), snap => {
    mine = new Set(); snap.forEach(d => mine.add(d.data().itemId)); M.setInterests(mine, onMine);
  }, fail));
  unsubs.push(F.onSnapshot(F.query(F.collection(db, 'interests'), F.where('sellerUid', '==', user.uid)), snap => {
    onMine = {}; snap.forEach(d => { const x = d.data(); (onMine[x.itemId] = onMine[x.itemId] || []).push(x.name || x.email); });
    M.setInterests(mine, onMine);
  }, fail));
}
async function setInterest(it, on) {
  if (!user) { M.toast('登入後才能按「我有興趣」。'); login(); return false; }
  if (it.sellerUid === user.uid) { M.toast('這是你自己的商品喔。'); return false; }
  const ref = F.doc(db, 'interests', it.id + '_' + user.uid);
  try {
    if (on) await F.setDoc(ref, {itemId: it.id, title: it.title, sellerUid: it.sellerUid || '', sellerEmail: it.sellerEmail || '', sellerName: it.seller,
      uid: user.uid, name: user.displayName || '', email: user.email, createdAt: Date.now()});
    else await F.deleteDoc(ref);
    return true;
  } catch (e) { fail(e); return false; }
}

/* ---------- 即時在線（Realtime Database） ---------- */
let meRef = null, where = {dep: null, seat: null};
function presence() {
  if (!rtdb) return;
  if (meRef) R.remove(meRef);
  meRef = R.push(R.ref(rtdb, 'presence'));
  R.onDisconnect(meRef).remove();
  writeWhere();
}
function writeWhere() {
  if (!meRef) return;
  const v = {t: R.serverTimestamp(), dep: where.dep || '', seat: where.seat || ''};
  if (user && user.displayName) v.name = user.displayName;
  R.set(meRef, v).catch(() => {});
}
function setWhere(dep, seat) { if (dep === where.dep && seat === where.seat) return; where = {dep, seat}; writeWhere(); }
if (rtdb) {
  // 同一個人開多個分頁、或斷線沒清掉的舊紀錄，只顯示一個；超過 3 分鐘沒更新的視為離線
  let last = null, off = 0;
  R.onValue(R.ref(rtdb, '.info/serverTimeOffset'), s => { off = s.val() || 0; });
  const show = () => {
    if (!last) return;
    const byName = new Map(), anon = [], now = Date.now() + off, myName = user && user.displayName;
    last.forEach(c => {
      if (meRef && c.key === meRef.key) return;
      const v = c.val() || {};
      if (!v.t || now - v.t > 3 * 60e3) return;
      const p = {id: c.key, name: v.name || '', dep: v.dep || null, seat: v.seat || null, t: v.t};
      if (!p.name) return anon.push(p);
      if (p.name === myName) return;
      const o = byName.get(p.name); if (!o || o.t < p.t) byName.set(p.name, p);
    });
    M.setPeople([...byName.values(), ...anon].map(p => (p.id = p.name ? 'n:' + p.name : p.id, p)));
  };
  R.onValue(R.ref(rtdb, 'presence'), snap => { last = snap; show(); });
  setInterval(writeWhere, 60e3); // 每分鐘回報一次，讓別人知道你還在
  setInterval(show, 30e3);
}

/* ---------- 登入狀態 ---------- */
A.onAuthStateChanged(auth, async u => {
  for (const f of unsubs) f(); unsubs = [];
  if (u && !domainOK(u.email)) { await A.signOut(auth); return; }
  user = u; isAdmin = false;
  if (u) {
    try { const d = await F.getDoc(F.doc(db, 'config', 'admins')); isAdmin = d.exists() && (d.data().emails || []).map(e => e.toLowerCase()).includes(u.email.toLowerCase()); } catch (e) {}
    subGroup(); subInterests(); subSeat();
  } else { M.setMySeat(null); M.setClaims({}); M.setGroup([], {}); mine = new Set(); onMine = {}; M.setInterests(mine, onMine); }
  M.setUser(u ? {uid: u.uid, name: u.displayName || u.email, email: u.email} : null, isAdmin);
  presence();
});

window.CLOUD = {login, logout, saveItems, saveName, saveGroup, setInterest, setWhere, claimSeat, unclaimSeat};
M.cloudReady();
