// client/src/api.js
import axios from 'axios';

const backend =
  process.env.REACT_APP_BACKEND_URL ||
  'https://hyre-backend.onrender.com/api';

const api = axios.create({
  baseURL: backend,
  withCredentials: true, // send/receive the refresh-token cookie
});

/* —— attach current access token + no-store header on every request —— */
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers['x-auth-token'] = token;
  cfg.headers['Cache-Control'] = 'no-store';
  return cfg;
});

/* —— handle 401 by refreshing token —— */
let refreshing = false;
let queue = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = true;
        try {
          const { data } = await api.get('/auth/refresh');
          localStorage.setItem('token', data.token);
          original.headers['x-auth-token'] = data.token;
          while (queue.length) queue.shift()(data.token);
        } catch (e) {
          console.error(e);
          // optional: redirect to login
        } finally {
          refreshing = false;
        }
      }
      return new Promise(resolve => {
        queue.push(token => {
          original.headers['x-auth-token'] = token;
          resolve(api(original));
        });
      });
    }
    return Promise.reject(err);
  }
);

export default api;

/* ── Fake payment for testing ─────────────────────────────────────────────────── */
/**
 * Simulate a fake payment for testing.
 * @param {string} bookingId
 * @returns {Promise}
 */
export const simulateFakePayment = bookingId =>
  api.post('/payment/fake', { bookingId });

/* ── Booking cancellation & refund helpers ─────────────────────────────────────── */
/**
 * Request to cancel a booking (marks it cancelPending).
 * @param {string} bookingId
 * @returns {Promise}
 */
export const requestBookingCancel = bookingId =>
  api.post('/bookings/cancel-request', { bookingId });

/**
 * Fetch all pending refund requests.
 * @returns {Promise}
 */
export const getPendingRefundRequests = () =>
  api.get('/refunds/pending');

/**
 * Simulate a fake refund for testing.
 * @param {string} bookingId
 * @returns {Promise}
 */
export const simulateFakeRefund = bookingId =>
  api.post('/refunds/fake', { bookingId });
