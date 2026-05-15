const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Shared base query: notes owned by or shared with the current user
const ACCESSIBLE_BASE = `
  SELECT DISTINCT n.* FROM notes n
  LEFT JOIN note_shares ns ON n.id = ns.note_id
  WHERE (n.owner_id = ? OR ns.user_id = ?)
`;

function fmt(note) {
  return {
    id:         note.id,
    title:      note.title,
    content:    note.content,
    category:   note.category || null,
    created_at: note.created_at,
    updated_at: note.updated_at,
  };
}

function ownerNote(id, userId) {
  return db.prepare('SELECT * FROM notes WHERE id = ? AND owner_id = ?').get(id, userId);
}

// ── GET /notes/search?q= ──────────────────────────────────────────────────────
// Must be declared BEFORE /:id so Express doesn't treat "search" as a note ID.
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ message: 'Query parameter q is required' });

  const kw = `%${q}%`;
  const notes = db.prepare(`
    ${ACCESSIBLE_BASE}
      AND (n.title LIKE ? OR n.content LIKE ?)
    ORDER BY n.updated_at DESC
  `).all(req.user.id, req.user.id, kw, kw);

  res.json(notes.map(fmt));
});

// ── GET /notes/category/:name — unique feature ────────────────────────────────
// Must also be declared BEFORE /:id.
router.get('/category/:name', (req, res) => {
  const notes = db.prepare(`
    ${ACCESSIBLE_BASE}
      AND LOWER(n.category) = LOWER(?)
    ORDER BY n.updated_at DESC
  `).all(req.user.id, req.user.id, req.params.name);

  res.json(notes.map(fmt));
});

// ── GET /notes ────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const notes = db.prepare(`
    ${ACCESSIBLE_BASE}
    ORDER BY n.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, req.user.id, limit, offset);

  res.json(notes.map(fmt));
});

// ── GET /notes/:id ────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const note = db.prepare(`
    ${ACCESSIBLE_BASE} AND n.id = ?
  `).get(req.user.id, req.user.id, req.params.id);

  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(fmt(note));
});

// ── POST /notes ───────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { title, content, category } = req.body;

  if (!title || !String(title).trim())
    return res.status(400).json({ message: 'Title is required' });
  if (!content || !String(content).trim())
    return res.status(400).json({ message: 'Content is required' });

  const id  = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO notes (id, title, content, category, owner_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, String(title).trim(), String(content).trim(), category || null, req.user.id, now, now);

  res.status(201).json(fmt(db.prepare('SELECT * FROM notes WHERE id = ?').get(id)));
});

// ── PUT /notes/:id ────────────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const note = ownerNote(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  const title    = req.body.title    !== undefined ? String(req.body.title).trim()    : note.title;
  const content  = req.body.content  !== undefined ? String(req.body.content).trim()  : note.content;
  const category = req.body.category !== undefined ? (req.body.category || null)      : note.category;

  if (!title)   return res.status(400).json({ message: 'Title cannot be empty' });
  if (!content) return res.status(400).json({ message: 'Content cannot be empty' });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE notes SET title = ?, content = ?, category = ?, updated_at = ? WHERE id = ?
  `).run(title, content, category, now, note.id);

  res.json(fmt(db.prepare('SELECT * FROM notes WHERE id = ?').get(note.id)));
});

// ── DELETE /notes/:id ─────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const note = ownerNote(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  db.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
  res.status(204).send();
});

// ── POST /notes/:id/share ─────────────────────────────────────────────────────
router.post('/:id/share', (req, res) => {
  const note = ownerNote(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  const { share_with_email } = req.body;
  if (!share_with_email)
    return res.status(400).json({ message: 'share_with_email is required' });

  const target = db.prepare('SELECT id FROM users WHERE email = ?').get(share_with_email);
  if (!target)
    return res.status(404).json({ message: 'User not found' });
  if (target.id === req.user.id)
    return res.status(400).json({ message: 'Cannot share a note with yourself' });
  if (db.prepare('SELECT 1 FROM note_shares WHERE note_id = ? AND user_id = ?').get(note.id, target.id))
    return res.status(409).json({ message: 'Note already shared with this user' });

  db.prepare('INSERT INTO note_shares (note_id, user_id) VALUES (?, ?)').run(note.id, target.id);
  res.json({ message: 'Note shared successfully' });
});

module.exports = router;
