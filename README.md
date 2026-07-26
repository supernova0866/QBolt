# ⚡ QBolt IDE

**A browser-based SQL and JavaScript IDE for your Turso database. No install. No setup. Just query.**

QBolt is a fully browser-based database IDE for working with Turso (libSQL) databases. Connect with a database URL and auth token, then write and run SQL or JavaScript directly against your database, all inside the browser.

---

## What you can do

### Connect
Paste your Turso database URL and auth token into the connect screen. Credentials are kept in session storage only, cleared the moment you close the tab, and never sent anywhere except your database.

### Write SQL or JavaScript
Switch between two modes with one click:
- **SQL mode**, for standard SQLite and libSQL statements, with syntax highlighting, bracket matching, and auto-close for quotes and brackets.
- **JS mode**, for automating your database with plain JavaScript. A `db` object is in scope, matching the Turso client API (`db.execute()`, `db.batch()`).

### Run it
Hit **Run** or `Ctrl+Enter`. In SQL mode, results render as a table right in the Output tab, with column headers, rows, and a row count. In JS mode, `console.log` output prints line by line.

### Pre-run checks
Before anything executes, the built-in verifier catches:
- Common SQL typos, like `SELCT` instead of `SELECT` or `FORM` instead of `FROM`
- Unmatched quotes and parentheses
- Destructive statements, including `DELETE` or `UPDATE` without a `WHERE` clause, `DROP`, and `TRUNCATE`, each shown as a warning you can confirm or cancel
- Real JavaScript syntax errors in JS mode, caught before execution

### Autocomplete
As you type in SQL mode, QBolt suggests table and column names pulled live from your database's schema, along with SQL keywords. Press `Ctrl+Space` to trigger it manually.

### Format SQL
The ✨ button reformats your SQL, breaking major clauses like `SELECT`, `FROM`, `WHERE`, and `JOIN` onto their own lines and uppercasing recognized keywords.

### Schema browser
The Schema tab lists every table in your connected database, along with column names, types, and primary keys. It refreshes automatically after any `CREATE`, `ALTER`, `DROP`, or `TRUNCATE` statement.

### Snippets
A set of ready-to-use SQL and JS snippets sit in the sidebar: listing tables, creating a table, inserting rows, joins, aggregates, batch inserts, and seeding from JSON. Click any one to load it into the editor.

### Auto-save
Your SQL and JS scripts are saved to this browser automatically every 10 seconds, so switching modes, refreshing the page, or coming back later picks up right where you left off. Save manually or clear saved scripts anytime from the ⚙ Settings panel.

---

## Table Viewer

A separate tab for browsing your data without writing a single query.

- Lists every table in the sidebar, along with its row count
- Click a table to page through its rows, read only
- Adjustable page size: 25, 50, 100, or 250 rows
- Reuses the same session as the main IDE, so there's no need to reconnect, as long as the main tab is still connected

Opens in its own browser tab, separate from the main IDE window.

---

## Settings

Tweak the IDE from the ⚙ Settings panel:

| Setting | What it does |
|---|---|
| **Verifier** | Pre-run safety checks for syntax and destructive statements |
| **Autocomplete** | Suggests table and column names from your DB schema |
| **Line numbers** | Show or hide line numbers |
| **Auto Mirror** | Auto-close brackets and quotes |
| **Auto-save** | Saves your SQL and JS scripts to this browser every 10 seconds |

A **Reload Engines** button in Settings hot-reloads the verifier, autocomplete, formatter, and storage scripts without refreshing the page, handy while developing them.

---

## Limitations

Worth knowing before you rely on it for anything serious:

- **Scripts persist, credentials don't.** Your SQL and JS scripts are saved to this browser's localStorage, but your database connection isn't: the URL and token live in session storage only, cleared the moment you close the tab. Reconnect each time you return.
- **Single browser, single device.** Saved scripts live in this browser only. There's no account system and no syncing between devices or browsers.
- **No server in between.** QBolt talks directly to your Turso database through the libSQL client, straight from the browser. Your database URL and token pass through your browser only, never through any third party of ours.
- **JS mode runs in the same page.** Scripts execute inside the browser tab itself using a real `AsyncFunction`, not a sandboxed worker. Treat it the same way you'd treat code you'd paste into a browser console.
- **The formatter is regex-based, not a full SQL parser.** It handles common clause breaks and keyword casing well, but it won't gracefully handle every edge case in a deeply nested query.
- **The verifier can't catch everything.** It flags common typos and destructive patterns, but it isn't a full SQL parser either. Some mistakes will still only surface when the database itself returns an error.
- **Table Viewer depends on the main tab.** It reads session storage from the main IDE tab. If that tab disconnects or closes, reconnect from the main IDE first, then reopen Table Viewer.
- **No version history.** There's no undo beyond your browser's in-session history, and no automatic backups.

---

## On mobile

QBolt IDE is designed for desktop. If you open it on a phone or a narrow screen, you'll see a message asking you to switch to a larger screen. There's currently no mobile-optimised view.

---

## What it runs on

Any modern browser: Chrome, Firefox, Safari, Edge. No extensions, no plugins, no accounts beyond your own Turso database.

The database connection is handled by the [libSQL Client](https://github.com/tursodatabase/libsql-client-ts). The editor is [CodeMirror 5](https://codemirror.net/).

---

## Credits

- **[libSQL Client](https://github.com/tursodatabase/libsql-client-ts)** - Turso/libSQL database driver (MIT License)
- **[CodeMirror 5](https://codemirror.net/)** - code editor (MIT License)
- **[JetBrains Mono](https://www.jetbrains.com/legalforms/fonts/)** - editor font (OFL License)
- **[Syne](https://fonts.google.com/specimen/Syne)** - UI font (OFL License)

## License

Licensed under **Proprietary**, **All Rights Reserved**. See [`LICENSE`](https://github.com/supernova0866/QBolt/blob/main/LICENSE) for full terms.

---

*Live app: [QBolt](https://supernova0866.github.io/QBolt/)*

*Built with ♡ by [Nova](https://supernova0866.github.io/Lore/)*
