const router = require('express').Router();

router.use('/',       require('./auth.routes'));
router.use('/notes',  require('./notes.routes'));

module.exports = router;
