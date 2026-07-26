// ════════════════════════════════════════
// QBolt — Storage Engine
// engine/storage.js
//
// Saves/loads the SQL and JS scratch scripts to localStorage.
// Key: 'qbolt_scripts'
// ════════════════════════════════════════

window.QBoltStorage = (function () {

  const KEY = 'qbolt_scripts';

  function save(state) {
    try {
      const data = {
        sql: state.sql,
        js: state.js,
        savedAt: Date.now(),
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function exists() {
    return localStorage.getItem(KEY) !== null;
  }

  function savedAt() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw).savedAt || null;
    } catch (e) {
      return null;
    }
  }

  return { save, load, clear, exists, savedAt };

})();
