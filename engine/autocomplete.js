// ════════════════════════════════════════
// QBolt Autocomplete Engine
// Builds a schema map (tables + columns) after each connection/login,
// then feeds CodeMirror's hint system with schema-aware suggestions.
// ════════════════════════════════════════
(function () {
  const KEYWORDS = [
    'SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE',
    'CREATE','TABLE','DROP','ALTER','ADD','COLUMN','JOIN','INNER','LEFT','RIGHT',
    'OUTER','ON','GROUP','BY','ORDER','ASC','DESC','HAVING','LIMIT','OFFSET',
    'AND','OR','NOT','NULL','IS','IN','LIKE','AS','DISTINCT','COUNT','SUM',
    'AVG','MIN','MAX','PRIMARY','KEY','FOREIGN','REFERENCES','UNIQUE','DEFAULT',
    'AUTOINCREMENT','INTEGER','TEXT','REAL','BLOB','BOOLEAN','TIMESTAMP',
    'CURRENT_TIMESTAMP','UNION','ALL','EXISTS','BETWEEN','CASE','WHEN','THEN',
    'ELSE','END','WITH','VIEW','INDEX','IF','BEGIN','COMMIT','ROLLBACK',
    'TRANSACTION','PRAGMA'
  ];

  let schema = {};       // { tableName: [{name, type, pk}, ...] }
  let allTables = [];
  let enabled = true;
  let attachedEditor = null;
  let inputTimer = null;

  function setSchema(newSchema) {
    schema = newSchema || {};
    allTables = Object.keys(schema);
  }

  function setEnabled(v) {
    enabled = !!v;
  }

  function clearGhost() {
    if (attachedEditor && attachedEditor.state.completionActive) {
      attachedEditor.state.completionActive.close();
    }
  }

  function buildGeneralCandidates() {
    const items = [];
    KEYWORDS.forEach(k => items.push({ text: k, type: 'keyword' }));
    allTables.forEach(t => items.push({ text: t, type: 'table' }));
    const seenCols = new Set();
    Object.entries(schema).forEach(([t, cols]) => {
      (cols || []).forEach(c => {
        if (!seenCols.has(c.name)) {
          seenCols.add(c.name);
          items.push({ text: c.name, type: 'column', table: t });
        }
      });
    });
    return items;
  }

  function renderHint(el, self, data) {
    const iconMap = { keyword: 'K', table: 'T', column: 'C' };
    const colorMap = { keyword: 'var(--text2)', table: 'var(--accent)', column: 'var(--teal)' };
    const icon = iconMap[data.itemType] || '';
    const color = colorMap[data.itemType] || 'var(--text)';
    el.innerHTML =
      '<span style="display:inline-block;width:14px;color:' + color +
      ';font-family:var(--mono);font-size:9.5px;font-weight:800;margin-right:7px;text-align:center">' +
      icon + '</span><span style="font-family:var(--mono);font-size:12px">' + data.text + '</span>' +
      (data.itemType === 'column' && data.table
        ? '<span style="float:right;color:var(--text3);font-family:var(--mono);font-size:9.5px;margin-left:14px">' + data.table + '</span>'
        : '');
  }

  function hint(cm) {
    const cur = cm.getCursor();
    const line = cm.getLine(cur.line);
    const beforeCursor = line.slice(0, cur.ch);

    const wordMatch = beforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
    const partial = wordMatch ? wordMatch[1] : '';
    const from = CodeMirror.Pos(cur.line, cur.ch - partial.length);
    const to = CodeMirror.Pos(cur.line, cur.ch);

    const beforePartial = beforeCursor.slice(0, beforeCursor.length - partial.length);
    const dotMatch = beforePartial.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.\s*$/);

    let candidates = [];
    if (dotMatch) {
      const tableName = dotMatch[1];
      const matchedTable = allTables.find(t => t.toLowerCase() === tableName.toLowerCase());
      if (matchedTable) {
        candidates = (schema[matchedTable] || []).map(c => ({ text: c.name, type: 'column', table: matchedTable }));
      }
    } else {
      candidates = buildGeneralCandidates();
    }

    const lowerPartial = partial.toLowerCase();
    const filtered = candidates
      .filter(c => c.text.toLowerCase().startsWith(lowerPartial))
      .sort((a, b) => {
        // tables/columns before generic keywords, then alphabetical
        const rank = { table: 0, column: 0, keyword: 1 };
        const r = (rank[a.type] ?? 2) - (rank[b.type] ?? 2);
        return r !== 0 ? r : a.text.localeCompare(b.text);
      })
      .slice(0, 40);

    if (filtered.length === 0) return null;

    return {
      list: filtered.map(c => ({
        text: c.text,
        displayText: c.text,
        itemType: c.type,
        table: c.table,
        render: renderHint
      })),
      from,
      to
    };
  }

  CodeMirror.registerHelper('hint', 'sql', hint);

  function attach(editorInstance) {
    attachedEditor = editorInstance;
    const existingKeys = editorInstance.getOption('extraKeys') || {};
    editorInstance.setOption('extraKeys', Object.assign({}, existingKeys, {
      'Ctrl-Space': 'autocomplete'
    }));

    editorInstance.on('inputRead', function (cm, change) {
      if (!enabled) return;
      if (cm.getOption('mode') !== 'text/x-sql') return;
      if (!change.text[0] || !/[a-zA-Z_.]/.test(change.text[0])) return;
      clearTimeout(inputTimer);
      inputTimer = setTimeout(() => {
        if (!cm.state.completionActive) {
          CodeMirror.showHint(cm, CodeMirror.hint.sql, { completeSingle: false });
        }
      }, 110);
    });
  }

  window.QBoltAutocomplete = { setSchema, setEnabled, attach, clearGhost };
})();
