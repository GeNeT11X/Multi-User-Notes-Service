const notesService = require('../services/notes.service');

const getNotes = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const q     = (req.query.q || '').trim();

    const { notes, total } = await notesService.getUserNotes(req.user._id, { page, limit, q });

    // Pagination metadata in headers (response body stays a plain array)
    res.set('X-Total-Count',  String(total));
    res.set('X-Total-Pages',  String(Math.ceil(total / limit)));
    res.set('X-Current-Page', String(page));

    res.json(notes);
  } catch (err) {
    next(err);
  }
};

const getNoteById = async (req, res, next) => {
  try {
    const note = await notesService.getNoteById(req.params.id, req.user._id);
    res.json(note);
  } catch (err) {
    next(err);
  }
};

const createNote = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;
    const note = await notesService.createNote({ title, content, tags }, req.user._id);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { title, content, tags, isPinned } = req.body;
    const note = await notesService.updateNote(
      req.params.id,
      { title, content, tags, isPinned },
      req.user._id
    );
    res.json(note);
  } catch (err) {
    next(err);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    await notesService.deleteNote(req.params.id, req.user._id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const shareNote = async (req, res, next) => {
  try {
    await notesService.shareNote(req.params.id, req.user._id, req.body.share_with_email);
    res.json({ message: 'Note shared successfully' });
  } catch (err) {
    next(err);
  }
};

const togglePin = async (req, res, next) => {
  try {
    const note   = await notesService.togglePin(req.params.id, req.user._id);
    const action = note.isPinned ? 'pinned' : 'unpinned';
    res.json({ message: `Note ${action} successfully`, isPinned: note.isPinned });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote, shareNote, togglePin };
