// server/controllers/verifyController.js
require('dotenv').config();           // ← make sure .env is loaded here
const fs   = require('fs');
const AWS  = require('aws-sdk');
const User = require('../models/Customer');   // adjust path to your Customer model

// ensure AWS knows your region and credentials
AWS.config.update({
  region: process.env.AWS_REGION     || 'eu-west-2',
  accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const rek = new AWS.Rekognition();

exports.verifyId = async (req, res) => {
  try {
    // read in the two uploaded files
    const licPath  = req.files.license[0].path;
    const selfPath = req.files.selfie[0].path;
    const licBuf   = fs.readFileSync(licPath);
    const selfBuf  = fs.readFileSync(selfPath);

    // compare faces
    const { FaceMatches } = await rek.compareFaces({
      SourceImage:        { Bytes: licBuf },
      TargetImage:        { Bytes: selfBuf },
      SimilarityThreshold: 75
    }).promise();

    // clean up temp files
    fs.unlinkSync(licPath);
    fs.unlinkSync(selfPath);

    if (!FaceMatches.length) {
      return res.status(400).json({
        success: false,
        error: 'Face on photo did not match license portrait.'
      });
    }

    // load the user record (must have dateOfBirth set)
    const userRecord = await User.findById(req.customer.id);
    if (!userRecord || !userRecord.dateOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'No date of birth on profile to verify against.'
      });
    }

    // OCR extract all text
    const { TextDetections } = await rek.detectText({ Image: { Bytes: licBuf } }).promise();

    // regex for UK-style dates (allowing ., / or - as separator)
    const dateRegex = /\b(\d{2}[\/.\-]\d{2}[\/.\-]\d{4})\b/;

    // collect all detections that look like dates, along with their Y-position
    const dateCandidates = TextDetections
      .filter(d =>
        dateRegex.test(d.DetectedText) &&
        d.Geometry &&
        d.Geometry.BoundingBox
      )
      .map(d => ({
        text: d.DetectedText.match(dateRegex)[1],
        top:  d.Geometry.BoundingBox.Top
      }));

    if (!dateCandidates.length) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract date of birth from the ID document.'
      });
    }

    // pick the candidate that’s highest on the page (smallest `top` value)
    dateCandidates.sort((a, b) => a.top - b.top);
    const [day, month, year] = dateCandidates[0].text.split(/[/.\-]/);
    const idDob      = new Date(`${year}-${month}-${day}`).toISOString().slice(0,10);
    const profileDob = new Date(userRecord.dateOfBirth).toISOString().slice(0,10);

    // compare just the ISO dates
    if (idDob !== profileDob) {
      return res.status(400).json({
        success: false,
        error: 'Date of birth on ID does not match your profile.'
      });
    }

    // persist verification status
    const similarity = FaceMatches[0].Similarity;
    await User.findByIdAndUpdate(req.customer.id, {
      idVerified:   true,
      idVerifiedAt: Date.now(),
      idSimilarity: similarity
    });

    res.json({ success: true, similarity: similarity.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};
