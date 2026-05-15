const router = require('express').Router();

const {
  getNotes, getNoteById, createNote, updateNote, deleteNote, shareNote, togglePin,
} = require('../controllers/notes.controller');

const { createNoteValidator, updateNoteValidator, shareNoteValidator } =
  require('../validators/notes.validator');

const validate        = require('../middlewares/validate.middleware');
const { protect }     = require('../middlewares/auth.middleware');
const { apiLimiter }  = require('../middlewares/rateLimiter.middleware');

// All notes routes require authentication
router.use(protect);
router.use(apiLimiter);

router.get('/',         getNotes);
router.get('/:id',      getNoteById);
router.post('/',        createNoteValidator, validate, createNote);
router.put('/:id',      updateNoteValidator, validate, updateNote);
router.delete('/:id',   deleteNote);
router.post('/:id/share', shareNoteValidator, validate, shareNote);
router.patch('/:id/pin',  togglePin);

module.exports = router;
