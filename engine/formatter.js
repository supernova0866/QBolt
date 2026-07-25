// ════════════════════════════════════════
// QBolt Formatter Engine
// Lightweight SQL prettifier: breaks major clauses onto their own lines,
// uppercases recognized keywords, indents AND/OR/ON continuations.
// Not a full parser — regex-based, but keeps string literals untouched.
// ════════════════════════════════════════
(function () {
  // Longest/most specific phrases first so they match before their substrings.
  const CLAUSE_KEYWORDS = [
    'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
    'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
    'GROUP BY', 'ORDER BY', 'UNION ALL', 'INSERT INTO', 'DELETE FROM',
    'SELECT', 'FROM', 'WHERE', 'HAVING', 'LIMIT', 'OFFSET',
    'VALUES', 'UPDATE', 'SET', 'JOIN', 'ON', 'UNION', 'AND', 'OR'
  ];

  function protectStrings(sql) {
    const strings = [];
    const protectedSql = sql.replace(/'([^'\\]|\\.)*'/g, m => {
      strings.push(m);
      return `__QBOLT_STR_${strings.length - 1}__`;
    });
    return { protectedSql, strings };
  }

  function restoreStrings(sql, strings) {
    return sql.replace(/__QBOLT_STR_(\d+)__/g, (m, i) => strings[Number(i)]);
  }

  function format(sql) {
    if (!sql || !sql.trim()) return sql;

    const { protectedSql, strings } = protectStrings(sql);
    let s = protectedSql.replace(/\s+/g, ' ').trim();

    CLAUSE_KEYWORDS.forEach(kw => {
      const re = new RegExp('\\b' + kw.replace(/ /g, '\\s+') + '\\b', 'gi');
      s = s.replace(re, '\n' + kw.toUpperCase());
    });

    let lines = s.split('\n').map(l => l.trim()).filter(Boolean);
    lines = lines.map(l => {
      if (/^(AND|OR|ON)\b/i.test(l)) return '  ' + l;
      return l;
    });

    let result = lines.join('\n');
    result = restoreStrings(result, strings);
    return result.trim();
  }

  window.QBoltFormatter = { format };
})();
