// server/services/srsService.js
exports.nextInterval = (prev = 1, rating) => {
  if (rating === 'easy') return prev * 2.5;
  if (rating === 'medium') return Math.max(prev * 1.4, 1);
  return 0.5; // hard: show soon
};
exports.nextReviewDate = (prevHours = 24, rating) => {
  const hours = exports.nextInterval(prevHours, rating);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};
