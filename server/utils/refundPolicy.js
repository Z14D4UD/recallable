// server/utils/refundPolicy.js
module.exports.calculateRefundPercentage = (policy, daysBefore) => {
  switch (policy) {
    case 'strict':
      if (daysBefore >= 14) return 100;
      if (daysBefore >= 7 ) return  50;
      return 0;
    case 'moderate':
      if (daysBefore >= 7 ) return 100;
      return 0;
    default:
      return 0;
  }
};
