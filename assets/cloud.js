// Firebase katmanı: öğretmen girişi (Auth) ve sınıf verileri (Firestore).
// Veri yapısı:
//   teachers/{uid}                 → ayarlar ve son açılan sınıf
//   teachers/{uid}/classes/{id}    → bir sınıfın öğrencileri, grupları, istatistikleri ve geçmişi
(function (root) {
  "use strict";
  const CONFIG = {
    apiKey: "AIzaSyA6UtXoxGZG5R4hN9D3RKMqaBV0itHWycE",
    authDomain: "elifsul.firebaseapp.com",
    projectId: "elifsul",
    storageBucket: "elifsul.firebasestorage.app",
    messagingSenderId: "504266382264",
    appId: "1:504266382264:web:0985417292d42644cc0d4d"
  };
  const fb = root.firebase;
  const available = !!(fb && fb.initializeApp && fb.auth && fb.firestore);
  let auth = null, db = null, uid = null;
  let status = "idle", statusCb = () => {};
  const timers = new Map(), pending = new Map();

  if (available) {
    try {
      fb.initializeApp(CONFIG);
      auth = fb.auth();
      db = fb.firestore();
      db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    } catch (err) {
      console.warn("Firebase başlatılamadı", err);
    }
  }

  function setStatus(s) { status = s; statusCb(s); }
  // Firestore undefined değer kabul etmez; düz JSON kopyası güvenlidir.
  function plain(obj) { return JSON.parse(JSON.stringify(obj)); }
  function teacherDoc() { return db.collection("teachers").doc(uid); }

  function flushOne(key) {
    const job = pending.get(key);
    if (!job) return Promise.resolve();
    pending.delete(key);
    clearTimeout(timers.get(key));
    timers.delete(key);
    setStatus("saving");
    return job().then(() => { if (!pending.size) setStatus(navigator.onLine === false ? "offline" : "saved"); })
      .catch((err) => { console.error("Kaydedilemedi", err); setStatus(err && err.code === "permission-denied" ? "denied" : "error"); });
  }

  function queue(key, job, delay) {
    pending.set(key, job);
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => flushOne(key), delay));
    setStatus("saving");
  }

  function flushAll() { return Promise.all([...pending.keys()].map(flushOne)); }

  const api = {
    available: !!(auth && db),
    get uid() { return uid; },
    get status() { return status; },
    onStatus(cb) { statusCb = cb || (() => {}); },
    onAuth(cb) {
      if (!auth) { cb(null); return; }
      auth.onAuthStateChanged((user) => { uid = user ? user.uid : null; cb(user); });
    },
    signIn(email, password) { return auth.signInWithEmailAndPassword(email, password); },
    async verifyPassword(password) {
      const user = auth.currentUser;
      if (!user) throw { code: "auth/no-current-user" };
      await user.reauthenticateWithCredential(fb.auth.EmailAuthProvider.credential(user.email, password));
    },
    async changePassword(current, next) {
      const user = auth.currentUser;
      if (!user) throw { code: "auth/no-current-user" };
      await user.reauthenticateWithCredential(fb.auth.EmailAuthProvider.credential(user.email, current));
      await user.updatePassword(next);
    },
    resetPassword(email) { return auth.sendPasswordResetEmail(email); },
    signOut() { return flushAll().then(() => auth.signOut()); },
    async loadAll() {
      const [profile, list] = await Promise.all([teacherDoc().get(), teacherDoc().collection("classes").get()]);
      const classes = {};
      list.forEach((d) => { classes[d.id] = { ...d.data(), id: d.id }; });
      setStatus("saved");
      return { profile: profile.exists ? profile.data() : null, classes };
    },
    saveProfile(data) {
      if (!uid) return;
      queue("profile", () => teacherDoc().set(plain(data), { merge: true }), 800);
    },
    saveClass(cls) {
      if (!uid || !cls || !cls.id) return;
      const copy = plain(cls);
      queue("class:" + cls.id, () => teacherDoc().collection("classes").doc(cls.id).set(copy), 1200);
    },
    deleteClass(id) {
      if (!uid) return Promise.resolve();
      pending.delete("class:" + id);
      clearTimeout(timers.get("class:" + id));
      setStatus("saving");
      return teacherDoc().collection("classes").doc(id).delete().then(() => setStatus("saved"));
    },
    flush: flushAll
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => { if (uid) setStatus(pending.size ? "saving" : "saved"); });
    window.addEventListener("offline", () => { if (uid) setStatus("offline"); });
    window.addEventListener("beforeunload", (e) => {
      if (!pending.size) return;
      flushAll();
      e.preventDefault();
      e.returnValue = "";
    });
  }
  root.MatCloud = api;
})(typeof window !== "undefined" ? window : globalThis);
