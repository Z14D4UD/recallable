// server/routes/flashcardRoutes.js
const router = require('express').Router();
const { generateFromPrompt, listByTopic } = require('../controllers/flashcardController');
const { protect } = require('../middlewares/authMiddleware'); // adjust name if different
router.post('/generate', protect, generateFromPrompt);
router.get('/:topic', protect, listByTopic);
module.exports = router;
