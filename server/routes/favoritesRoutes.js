const router = require('express').Router();
const auth     = require('../middlewares/authMiddleware');
const ctrl     = require('../controllers/favoritesController');

router.use(auth);               // all these routes require a logged-in customer
router.get   ('/',      ctrl.getFavorites);
router.post  ('/:listingId',   ctrl.addFavorite);
router.delete('/:listingId',   ctrl.removeFavorite);

module.exports = router;