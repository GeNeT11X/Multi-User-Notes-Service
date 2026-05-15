const express = require('express');
const cors    = require('cors');

const authRoutes  = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const openapi     = require('./openapi');

const app = express();

app.use(cors());
app.use(express.json());

// ── Auth ──────────────────────────────────────────────────────────────────────
app.use(authRoutes);

// ── Notes ─────────────────────────────────────────────────────────────────────
app.use('/notes', notesRoutes);

// ── Search (top-level alias) ──────────────────────────────────────────────────
const auth = require('./middleware/auth');
const db   = require('./db');

app.get('/search', auth, (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ message: 'Query parameter q is required' });

  const kw = `%${q}%`;
  const notes = db.prepare(`
    SELECT DISTINCT n.* FROM notes n
    LEFT JOIN note_shares ns ON n.id = ns.note_id
    WHERE (n.owner_id = ? OR ns.user_id = ?)
      AND (n.title LIKE ? OR n.content LIKE ?)
    ORDER BY n.updated_at DESC
  `).all(req.user.id, req.user.id, kw, kw);

  res.json(notes.map(n => ({
    id: n.id, title: n.title, content: n.content,
    category: n.category || null, created_at: n.created_at, updated_at: n.updated_at,
  })));
});

// ── OpenAPI spec ──────────────────────────────────────────────────────────────
app.get('/openapi.json', (req, res) => res.json(openapi));

// ── About ─────────────────────────────────────────────────────────────────────
app.get('/about', (req, res) => res.json({
  name:  'YOUR_NAME_HERE',  // TODO: replace with your name
  email: 'chemicalliving2005@gmail.com',
  'my features': {
    'Note Categories/Tags': (
      'Users can assign a category string (e.g. "work", "personal", "shopping") ' +
      'to any note at create or update time. ' +
      'GET /notes/category/{name} returns all notes (owned + shared) that match ' +
      'that category, case-insensitively. ' +
      'This mirrors the label/folder UX in Google Keep and requires no schema changes ' +
      'beyond a single nullable text column, keeping the API simple to extend.'
    ),
  },
}));

// ── Root → Swagger UI ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const spec = `${req.protocol}://${req.get('host')}/openapi.json`;
  res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>Notes API</title>
    <meta charset="utf-8"/>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css"/>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: "${spec}", dom_id: '#swagger-ui', presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset] });
    </script>
  </body>
</html>`);
});

module.exports = app;
