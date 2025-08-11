// server/controllers/flashcardController.js
const Flashcard = require('../models/Flashcard');
// for now, mock generation; wire OpenAI later
exports.generateFromPrompt = async (req, res) => {
  const { topic } = req.body;
  const seed = [
    { q: `What is ${topic}?`, a: `Short definition of ${topic}.` },
    { q: `Why is ${topic} important?`, a: `Key reason.` },
  ];
  const docs = await Flashcard.insertMany(
    seed.map(c => ({ user: req.user._id, topic, question: c.q, answer: c.a }))
  );
  res.json({ ok: true, count: docs.length });
};

exports.listByTopic = async (req,res) => {
  const { topic } = req.params;
  const cards = await Flashcard.find({ user: req.user._id, topic }).sort('nextReviewAt');
  res.json(cards);
};
