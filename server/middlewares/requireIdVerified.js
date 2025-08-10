const Customer = require('../models/Customer');

module.exports = async (req, res, next) => {
  // must be authenticated as a customer
  if (!req.customer) {
    return res.status(401).json({ msg: 'Authentication required' });
  }

  // load fresh customer data
  const cust = await Customer.findById(req.customer.id);
  if (!cust) {
    return res.status(404).json({ msg: 'Customer not found' });
  }

  // check ID verification flag
  if (!cust.idVerified) {
    return res
      .status(403)
      .json({ msg: 'You must verify your driving licence before booking a car.' });
  }

  next();
};
