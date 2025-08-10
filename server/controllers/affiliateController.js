const Affiliate = require('../models/Affiliate');

/**
 * GET /api/affiliate/stats
 * Returns affiliate stats including pending & available balances
 */
exports.getAffiliateStats = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.affiliate.id);
    if (!affiliate) {
      return res.status(404).json({ msg: 'Affiliate not found' });
    }

    const data = {
      last30Days: {
        referrals:   affiliate.recentReferrals   || 0,
        visits:      affiliate.recentVisits      || 0,
        conversions: affiliate.conversions       || 0,
      },
      allTime: {
        referrals:      affiliate.referrals      || 0,
        paidReferrals:  affiliate.paidReferrals  || 0,
        unpaidEarnings: affiliate.unpaidEarnings || 0,
        totalEarnings:  affiliate.totalEarnings  || 0,
      },
      pendingBalance:   affiliate.pendingBalance   || 0,
      availableBalance: affiliate.availableBalance || 0,
      affiliateCode:    affiliate.affiliateCode,
      recentActivity:   [] // you can populate this later
    };

    res.json(data);
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    res.status(500).json({ msg: 'Server error fetching affiliate stats' });
  }
};

/**
 * GET /api/affiliate/me
 * Retrieve affiliate profile
 */
exports.getAffiliateProfile = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.affiliate.id);
    if (!affiliate) {
      return res.status(404).json({ msg: 'Affiliate not found' });
    }
    res.json(affiliate);
  } catch (error) {
    console.error('Error fetching affiliate profile:', error);
    res.status(500).json({ msg: 'Server error fetching affiliate profile' });
  }
};

/**
 * PUT /api/affiliate/me
 * Update affiliate profile, including avatar upload
 */
exports.updateAffiliateProfile = async (req, res) => {
  try {
    const { name, email, location, aboutMe, phoneNumber } = req.body;
    const updateData = { name, email, location, aboutMe, phoneNumber };

    if (req.file) {
      // only use the filename (with extension); upload middleware serves it
      updateData.avatarUrl = `uploads/${req.file.filename}`;
    }

    const updatedAffiliate = await Affiliate.findByIdAndUpdate(
      req.affiliate.id,
      updateData,
      { new: true }
    );

    if (!updatedAffiliate) {
      return res.status(404).json({ msg: 'Affiliate not found' });
    }

    res.json(updatedAffiliate);
  } catch (error) {
    console.error('Error updating affiliate profile:', error);
    res.status(500).json({ msg: 'Server error updating affiliate profile' });
  }
};

/**
 * POST /api/affiliate/visit
 * Public endpoint: record a click-through (visit) on your landing page
 */
exports.recordAffiliateVisit = async (req, res) => {
  try {
    const { affiliateCode } = req.body;
    const aff = await Affiliate.findOne({ affiliateCode: affiliateCode.toUpperCase() });
    if (!aff) {
      return res.status(400).json({ msg: 'Invalid affiliate code' });
    }
    aff.recentVisits = (aff.recentVisits || 0) + 1;
    await aff.save();
    return res.sendStatus(204);
  } catch (err) {
    console.error('Error recording affiliate visit:', err);
    return res.status(500).json({ msg: 'Server error recording visit' });
  }
};
