const express        = require('express');
const multer         = require('multer');
const { verifyId }   = require('../controllers/verifyController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload         = multer({ dest: 'uploads/' });

const router = express.Router();

router.post(
  '/verify-id',
  authMiddleware,                     // ensure we know who “req.user” is
  upload.fields([
    { name: 'license' },
    { name: 'selfie' }
  ]),
  verifyId                            // our controller method
);

module.exports = router;
