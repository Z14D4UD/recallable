/* eslint-disable no-console */
const path         = require('path');
const mongoose     = require('mongoose');   // for ObjectId validation
const Car          = require('../models/Car');
const Listing      = require('../models/Listing');
const Business     = require('../models/Business');
const NodeGeocoder = require('node-geocoder');

// ────────────────────────────  GEO  ──────────────────────────────
const geocoder = NodeGeocoder({
  provider : 'google',
  apiKey   : process.env.GOOGLE_MAPS_API_KEY,
  formatter: null
});

// ───────────────────────── UPLOAD CAR ────────────────────────────
exports.uploadCar = async (req, res) => {
  const {
    carMake, model, location, latitude, longitude,
    pricePerDay, description, year, mileage, features,
    availableFrom, availableTo
  } = req.body;

  const businessId = req.business.id;
  const imageUrl   = req.file
    ? 'uploads/' + path.basename(req.file.path).replace(/\\/g, '/')
    : '';

  try {
    const car = new Car({
      business      : businessId,
      carMake,
      model,
      location,
      latitude      : parseFloat(latitude),
      longitude     : parseFloat(longitude),
      pricePerDay,
      imageUrl,
      description,
      year,
      mileage,
      features      : features ? features.split(',').map(s => s.trim()) : [],
      availableFrom : availableFrom ? new Date(availableFrom) : undefined,
      availableTo   : availableTo   ? new Date(availableTo)   : undefined
    });

    await car.save();
    await Business.findByIdAndUpdate(businessId, { $inc: { points: 10 } });
    return res.status(201).json({ car });
  } catch (err) {
    console.error('Error uploading car:', err);
    return res.status(500).json({ message: 'Server error while uploading car.' });
  }
};

// ─────────────────────── GET ALL CARS ────────────────────────────
exports.getCars = async (_req, res) => {
  try {
    const cars = await Car.find({}).populate('business', 'name email');
    return res.json(cars);
  } catch (err) {
    console.error('Error fetching cars:', err);
    return res.status(500).json({ message: 'Server error while retrieving cars.' });
  }
};

// ─────────────── SINGLE-COLLECTION CAR SEARCH ────────────────────
exports.searchCars = async (req, res) => {
  try {
    const { query, make, lat, lng, radius, price, vehicleType, year } = req.query;
    const filter = {};

    if (query?.trim()) filter.$or = [
      { location: { $regex: query, $options: 'i' } },
      { address : { $regex: query, $options: 'i' } }
    ];
    if (make?.trim())        filter.carMake    = { $regex: make, $options: 'i' };
    if (lat && lng && radius) {
      const latN = parseFloat(lat), lngN = parseFloat(lng), r = parseFloat(radius);
      filter.latitude  = { $gte: latN - r, $lte: latN + r };
      filter.longitude = { $gte: lngN - r, $lte: lngN + r };
    }
    if (price && parseFloat(price) > 0)
      filter.pricePerDay = { $lte: parseFloat(price) };
    if (year?.trim())        filter.year       = parseInt(year, 10);
    if (vehicleType?.trim()) filter.model      = { $regex: vehicleType, $options: 'i' };

    const cars = await Car.find(filter).populate('business', 'name email');
    return res.json(cars);
  } catch (err) {
    console.error('Error searching cars:', err);
    return res.status(500).json({ message: 'Server error while searching for cars.' });
  }
};

// ───────────────────── SEARCH CARS + LISTINGS ────────────────────
exports.searchAll = async (req, res) => {
  try {
    const {
      query, make, lat, lng, radius, fromDate, untilDate,
      price, vehicleType, year
    } = req.query;

    // build Car filter
    const carFilter = {};
    if (query?.trim())       carFilter.$text        = { $search: query };
    if (make?.trim())        carFilter.carMake      = { $regex: make, $options: 'i' };
    if (lat && lng) {
      const latN = parseFloat(lat), lngN = parseFloat(lng);
      const rDeg = (parseFloat(radius) || 50) / 111;
      carFilter.latitude  = { $gte: latN - rDeg, $lte: latN + rDeg };
      carFilter.longitude = { $gte: lngN - rDeg, $lte: lngN + rDeg };
    }
    if (price && parseFloat(price) > 0)
      carFilter.pricePerDay = { $lte: parseFloat(price) };
    if (year?.trim())        carFilter.year         = parseInt(year, 10);
    if (vehicleType?.trim()) carFilter.model        = { $regex: vehicleType, $options: 'i' };

    // build Listing filter
    const listingFilter = {};
    if (query?.trim())       listingFilter.$text      = { $search: query };
    if (make?.trim())        listingFilter.make       = { $regex: make, $options: 'i' };
    if (price && parseFloat(price) > 0)
      listingFilter.pricePerDay = { $lte: parseFloat(price) };
    if (year?.trim())        listingFilter.year       = parseInt(year, 10);
    if (vehicleType?.trim()) listingFilter.carType   = { $regex: vehicleType, $options: 'i' };
    if (fromDate?.trim() && untilDate?.trim()) {
      const sFrom  = new Date(fromDate), sUntil = new Date(untilDate);
      listingFilter.availableFrom = { $lte: sUntil };
      listingFilter.availableTo   = { $gte: sFrom  };
    }

    // query DB
    const [cars, listings] = await Promise.all([
      Car.find(carFilter).populate('business', 'name email'),
      Listing.find(listingFilter)
    ]);

    // geocode missing coords & add priceLabel
    const geocodeIfMissing = async (obj, addrField) => {
      if ((!obj.latitude || !obj.longitude) && obj[addrField]) {
        try {
          const geo = await geocoder.geocode(obj[addrField]);
          if (geo?.length) {
            obj.latitude  = geo[0].latitude;
            obj.longitude = geo[0].longitude;
          }
        } catch (e) {
          console.error('Geocode error:', e);
        }
      }
      obj.priceLabel = obj.pricePerDay
        ? `£${parseFloat(obj.pricePerDay).toFixed(0)}`
        : '£0';
      return obj;
    };

    const finalCars     = await Promise.all(cars.map(c     => geocodeIfMissing(c.toObject(), 'location')));
    const finalListing  = await Promise.all(listings.map(l => geocodeIfMissing(l.toObject(), 'address')));

    return res.json([
      ...finalCars    .map(c => ({ type: 'car',     data: c })),
      ...finalListing .map(l => ({ type: 'listing', data: l }))
    ]);
  } catch (err) {
    console.error('Error searching cars+listings:', err);
    return res.status(500).json({ message: 'Server error while searching.' });
  }
};

// ─────────────────────── SINGLE CAR BY ID ────────────────────────
exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('business', 'name email');
    if (!car) return res.status(404).json({ message: 'Car not found.' });
    return res.json(car);
  } catch (err) {
    console.error('Error fetching car by ID:', err);
    return res.status(500).json({ message: 'Server error while retrieving the car.' });
  }
};

// ─────────────────────── COMPARE CARS & LISTINGS ───────────────────────────
/**
 * GET /api/cars/compare?ids=123,456,789
 * Returns a unified list of both Car and Listing docs.
 */
exports.compareCars = async (req, res) => {
  try {
    const ids = (req.query.ids || '')
      .split(',')
      .map(id => id.trim())
      .filter(id => mongoose.Types.ObjectId.isValid(id));

    const [carDocs, listingDocs] = await Promise.all([
      Car.find({ _id: { $in: ids } }).lean(),
      Listing.find({ _id: { $in: ids } }).lean()
    ]);

    // Helper to gather listing features
    const flagMap = [
      ['GPS',            'gps'],
      ['Bluetooth',      'bluetooth'],
      ['Heated seats',   'heatedSeats'],
      ['Parking sensors','parkingSensors'],
      ['Backup camera',  'backupCamera'],
      ['Apple CarPlay',  'appleCarPlay'],
      ['Android Auto',   'androidAuto'],
      ['Keyless entry',  'keylessEntry'],
      ['Child seat',     'childSeat'],
      ['Leather seats',  'leatherSeats'],
      ['Tinted windows', 'tintedWindows'],
      ['Convertible',    'convertible'],
      ['Roof rack',      'roofRack'],
      ['Pet friendly',   'petFriendly'],
      ['Smoke-free',     'smokeFree'],
      ['Seat covers',    'seatCovers'],
      ['Dash cam',       'dashCam'],
    ];

    const carResults = carDocs.map(doc => ({
      _id:         doc._id,
      carMake:    doc.carMake,
      model:       doc.model,
      title:       null,
      location:    doc.location,
      address:     null,
      pricePerDay: doc.pricePerDay,
      imageUrl:    doc.imageUrl,
      images:      [],
      year:        doc.year,
      mileage:     doc.mileage,
      features:    Array.isArray(doc.features) ? doc.features : [],
      description: doc.description,
    }));

    const listingResults = listingDocs.map(doc => {
      const features = flagMap
        .filter(([label, field]) => doc[field])
        .map(([label]) => label);

      return {
        _id:         doc._id,
        carMake:    null,
        model:       null,
        title:       doc.title,
        location:    null,
        address:     doc.address,
        pricePerDay: doc.pricePerDay,
        imageUrl:    '',
        images:      Array.isArray(doc.images) ? doc.images : [],
        year:        doc.year,
        mileage:     doc.mileage,
        features,
        description: doc.description,
      };
    });

    return res.json([
      ...carResults,
      ...listingResults
    ]);
  } catch (err) {
    console.error('compareCars error:', err);
    return res.status(500).json({ message: 'Failed to compare cars/listings' });
  }
};
