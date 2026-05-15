const mongoose = require('mongoose');
const Note     = require('../models/Note.model');
const User     = require('../models/User.model');
const AppError = require('../utils/AppError');

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid ID format', 400);
};

// Base filter: notes the user owns OR has been shared with
const accessFilter = (userId, noteId = null) => {
  const filter = { $or: [{ owner: userId }, { sharedWith: userId }] };
  if (noteId) filter._id = noteId;
  return filter;
};

const getUserNotes = async (userId, { page, limit, q }) => {
  const skip   = (page - 1) * limit;
  const filter = accessFilter(userId);

  if (q) filter.$text = { $search: q };

  const projection = q ? { score: { $meta: 'textScore' } } : {};
  const sort = q
    ? { score: { $meta: 'textScore' }, isPinned: -1, updated_at: -1 }
    : { isPinned: -1, updated_at: -1 };

  const [notes, total] = await Promise.all([
    Note.find(filter, projection).sort(sort).skip(skip).limit(limit),
    Note.countDocuments(filter),
  ]);

  return { notes, total };
};

const getNoteById = async (noteId, userId) => {
  assertValidId(noteId);
  const note = await Note.findOne(accessFilter(userId, noteId));
  if (!note) throw new AppError('Note not found', 404);
  return note;
};

const createNote = async ({ title, content, tags }, userId) => {
  return Note.create({ title, content, tags, owner: userId });
};

const updateNote = async (noteId, updates, userId) => {
  assertValidId(noteId);

  // Whitelist updatable fields — never allow owner/sharedWith changes here
  const allowed = {};
  if (updates.title    !== undefined) allowed.title    = updates.title;
  if (updates.content  !== undefined) allowed.content  = updates.content;
  if (updates.tags     !== undefined) allowed.tags     = updates.tags;
  if (updates.isPinned !== undefined) allowed.isPinned = updates.isPinned;

  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: userId },
    allowed,
    { new: true, runValidators: true }
  );

  if (!note) throw new AppError('Note not found', 404);
  return note;
};

const deleteNote = async (noteId, userId) => {
  assertValidId(noteId);
  const note = await Note.findOneAndDelete({ _id: noteId, owner: userId });
  if (!note) throw new AppError('Note not found', 404);
};

const shareNote = async (noteId, userId, shareWithEmail) => {
  assertValidId(noteId);

  const note = await Note.findOne({ _id: noteId, owner: userId });
  if (!note) throw new AppError('Note not found', 404);

  const target = await User.findOne({ email: shareWithEmail });
  if (!target) throw new AppError('User not found', 404);

  if (target._id.equals(userId)) {
    throw new AppError('Cannot share a note with yourself', 400);
  }

  if (note.sharedWith.some((id) => id.equals(target._id))) {
    throw new AppError('Note already shared with this user', 409);
  }

  note.sharedWith.push(target._id);
  await note.save();
};

const togglePin = async (noteId, userId) => {
  assertValidId(noteId);

  const note = await Note.findOne({ _id: noteId, owner: userId });
  if (!note) throw new AppError('Note not found', 404);

  note.isPinned = !note.isPinned;
  await note.save();
  return note;
};

module.exports = {
  getUserNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  togglePin,
};
