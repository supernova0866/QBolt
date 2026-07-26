// ════════════════════════════════════════
// QBolt — Pre-run Verifier
// engine/verifier.js
//
// Runs before a query/script executes. Catches destructive
// statements and common mistakes with human-readable messages.
// Returns: { ok: boolean, issues: [{ severity: 'error'|'warning', message }] }
// ════════════════════════════════════════

window.QBoltVerifier = (function () {

  // ── Helpers ──────────────────────────────────────
  function lines(src) { return src.split('\n'); }

  // Strip single-quoted string literals so keyword checks don't fire inside them
  function stripSqlStrings(s) {
    return s.replace(/'([^'\\]|\\.)*'/g, "''");
  }

  // Split on statement-terminating semicolons, but not ones inside quotes
  function splitStatements(code) {
    const out = [];
    let cur = '', inStr = false;
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      if (ch === "'") { inStr = !inStr; cur += ch; continue; }
      if (ch === ';' && !inStr) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out;
  }

  const TYPOS = {
    'SELCT': 'SELECT', 'SELET': 'SELECT', 'SELEC': 'SELECT',
    'FORM': 'FROM', 'FRM': 'FROM',
    'WEHRE': 'WHERE', 'WHER': 'WHERE', 'WHRE': 'WHERE',
    'INSRT': 'INSERT', 'INSERTT': 'INSERT',
    'UPDATA': 'UPDATE', 'UPDTAE': 'UPDATE',
    'DELET': 'DELETE', 'DELE': 'DELETE',
    'TABEL': 'TABLE', 'TABL': 'TABLE',
    'GRUP': 'GROUP', 'GROPU': 'GROUP',
    'ORDR': 'ORDER',
    'VALUS': 'VALUES', 'VALEUS': 'VALUES',
  };

  // ── SQL verification ──────────────────────────────
  function verifySql(code) {
    const issues = [];

    // Unmatched single quotes across the whole snippet
    const withoutStrings = code.replace(/'([^'\\]|\\.)*'/g, '');
    const strayQuotes = (withoutStrings.match(/'/g) || []).length;
    if (strayQuotes % 2 !== 0) {
      issues.push({ severity: 'error', message: "Unmatched single quote (') — check your string literals." });
    }

    // Balanced parentheses (ignoring quoted content)
    let depth = 0, unexpectedClose = false;
    for (const ch of stripSqlStrings(code)) {
      if (ch === '(') depth++;
      if (ch === ')') { depth--; if (depth < 0) { unexpectedClose = true; break; } }
    }
    if (unexpectedClose) {
      issues.push({ severity: 'error', message: 'Unexpected closing parenthesis — check your statement.' });
    } else if (depth !== 0) {
      issues.push({ severity: 'error', message: `Unbalanced parentheses — missing ${depth} closing ')'.` });
    }

    splitStatements(code).forEach(stmt => {
      const s = stmt.trim();
      if (!s || s.startsWith('--')) return;

      // Common keyword typos
      Object.entries(TYPOS).forEach(([wrong, correct]) => {
        const re = new RegExp(`(?<![A-Za-z_])${wrong}(?![A-Za-z_])`, 'i');
        if (re.test(stripSqlStrings(s))) {
          issues.push({ severity: 'error', message: `Possible typo: "${wrong}" — did you mean "${correct}"?` });
        }
      });

      // Trailing comma before FROM or a closing paren
      if (/,\s*FROM\b/i.test(s)) {
        issues.push({ severity: 'error', message: 'Trailing comma before FROM — remove the extra comma after the last column.' });
      }
      if (/,\s*\)/.test(stripSqlStrings(s))) {
        issues.push({ severity: 'error', message: 'Trailing comma before a closing parenthesis.' });
      }

      // DELETE without WHERE
      const delM = s.match(/^\s*DELETE\s+FROM\s+["'`\[]?(\w+)["'`\]]?/i);
      if (delM && !/\bWHERE\b/i.test(s)) {
        issues.push({ severity: 'warning', message: `DELETE without WHERE will remove ALL rows from "${delM[1]}". Add a WHERE clause to limit it, or confirm this is intentional.` });
      }

      // UPDATE without WHERE
      const updM = s.match(/^\s*UPDATE\s+["'`\[]?(\w+)["'`\]]?/i);
      if (updM && /\bSET\b/i.test(s) && !/\bWHERE\b/i.test(s)) {
        issues.push({ severity: 'warning', message: `UPDATE without WHERE will modify ALL rows in "${updM[1]}". Add a WHERE clause to limit it, or confirm this is intentional.` });
      }

      // DROP TABLE / VIEW / INDEX / DATABASE
      const dropM = s.match(/^\s*DROP\s+(TABLE|VIEW|INDEX|DATABASE)\s+(?:IF\s+EXISTS\s+)?["'`\[]?(\w+)["'`\]]?/i);
      if (dropM) {
        issues.push({ severity: 'warning', message: `This will permanently drop the ${dropM[1].toLowerCase()} "${dropM[2]}" — this cannot be undone.` });
      }

      // TRUNCATE
      if (/^\s*TRUNCATE\s+/i.test(s)) {
        issues.push({ severity: 'warning', message: 'TRUNCATE will permanently remove all rows and cannot be undone.' });
      }
    });

    return { ok: issues.every(i => i.severity !== 'error'), issues };
  }

  // ── JS verification ────────────────────────────────
  function verifyJs(code) {
    const issues = [];

    // Real syntax validation: constructing (not calling) an AsyncFunction
    // throws a genuine SyntaxError without executing any user code.
    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      new AsyncFunction('db', 'console', code);
    } catch (e) {
      issues.push({ severity: 'error', message: `SyntaxError: ${e.message}` });
      return { ok: false, issues };
    }

    // Missing "await" before db.execute(...) / db.batch(...)
    lines(code).forEach((line, i) => {
      const m = line.match(/\bdb\.(execute|batch)\s*\(/);
      if (m && !/\bawait\b/.test(line)) {
        issues.push({ severity: 'warning', message: `Line ${i + 1}: call to db.${m[1]}() without "await" — you'll get a pending Promise instead of the actual result.` });
      }
    });

    return { ok: issues.every(i => i.severity !== 'error'), issues };
  }

  // ── Entry point ────────────────────────────────────
  function verify(code, mode) {
    if (mode === 'js') return verifyJs(code);
    return verifySql(code);
  }

  return { verify };
})();
