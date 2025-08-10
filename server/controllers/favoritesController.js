const Favorite = require('../models/Favorite');
const Listing  = require('../models/Listing');

/**
 * GET /api/favorites
 * Returns the current customer's favorites, populated with listing data.
 */
exports.getFavorites = async (req, res) => {
  try {
    const favs = await Favorite.find({ customer: req.customer.id })
      .populate({ path: 'listing', model: 'Listing' });
    // return array of listing docs
    const listings = favs.map(f => f.listing);
    res.json(listings);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ msg: 'Server error fetching favorites' });
  }
};

/**
 * POST /api/favorites/:listingId
 * Add a listing to favorites
 */
exports.addFavorite = async (req, res) => {
  const { listingId } = req.params;
  try {
    // ensure listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    // prevent dupes
    const exists = await Favorite.findOne({ customer: req.customer.id, listing: listingId });
    if (exists) return res.status(400).json({ msg: 'Already in favorites' });

    const fav = new Favorite({
      customer: req.customer.id,
      listing:  listingId
    });
    await fav.save();
    res.json({ msg: 'Added to favorites' });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ msg: 'Server error adding favorite' });
  }
};

/**
 * DELETE /api/favorites/:listingId
 * Remove a listing from favorites
 */
exports.removeFavorite = async (req, res) => {
  const { listingId } = req.params;
  try {
    await Favorite.findOneAndDelete({ customer: req.customer.id, listing: listingId });
    res.json({ msg: 'Removed from favorites' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ msg: 'Server error removing favorite' });
  }
};
