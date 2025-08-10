// client/src/pages/PaymentPage.js

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalButtons } from '@paypal/react-paypal-js';
import api from '../api';

import SideMenuCustomer from '../components/SideMenuCustomer';
import cls from '../styles/PaymentPage.module.css';

const daysBetween = (a, b) => Math.max(1, Math.ceil((b - a) / 86400000));

export default function PaymentPage() {
  const [qs]            = useSearchParams();
  const navigate        = useNavigate();
  const stripe          = useStripe();
  const elements        = useElements();
  const listingId       = qs.get('listingId');
  const fromISO         = qs.get('from');
  const toISO           = qs.get('to');
  const fromDate        = new Date(fromISO);
  const toDate          = new Date(toISO);

  /* ── state ─────────────────────────────────────────────────────── */
  const [menuOpen,         setMenuOpen]         = useState(false);
  const [listing,          setListing]          = useState(null);
  const [method,           setMethod]           = useState('card');
  const [bookingType,      setBookingType]      = useState('refundable');
  const [message,          setMessage]          = useState('');
  const [affiliateCode,    setAffiliateCode]    = useState('');
  const [licenseFile,      setLicenseFile]      = useState(null);     // NEW
  const [processing,       setProcessing]       = useState(false);
  const [idVerified,       setIdVerified]       = useState(true);
  const [checkingId,       setCheckingId]       = useState(true);
  const [verificationError, setVerificationError] = useState(null);

  /* ── auth guard ────────────────────────────────────────────────── */
  const token = localStorage.getItem('token') || '';
  useEffect(() => {
    if (!token) {
      alert('Please log in to continue booking.');
      navigate('/login');
    }
  }, [token, navigate]);

  /* ── fetch listing once ────────────────────────────────────────── */
  useEffect(() => {
    api.get(`/listings/${listingId}`)
      .then(r => setListing(r.data))
      .catch(err => {
        console.error('Payment page fetch error:', err);
        alert(
          err.response?.status === 404
            ? 'Listing not found.'
            : 'Failed to load booking info.'
        );
        navigate('/');
      });
  }, [listingId, navigate]);

  /* ── fetch customer to check ID verification ───────────────────── */
  useEffect(() => {
    api.get('/account')
      .then(res => {
        setIdVerified(res.data.idVerified);
        setVerificationError(res.data.verificationError);
      })
      .catch(err => {
        console.error('Error fetching account for ID check:', err);
        setIdVerified(false);
      })
      .finally(() => setCheckingId(false));
  }, []);

  if (!listing || checkingId) {
    return <p className={cls.loading}>Loading booking…</p>;
  }

  /* ── derived pricing ───────────────────────────────────────────── */
  const days   = daysBetween(fromDate, toDate);
  const nfPrice = listing.nonRefundablePrice > 0
    ? listing.nonRefundablePrice
    : listing.pricePerDay * 0.95;

  const base     = bookingType === 'refundable' ? listing.pricePerDay : nfPrice;
  const subtotal = days * base;
  const vat      = subtotal * 0.2;
  const service  = (subtotal / 1.2) * 0.05;
  const total    = subtotal + vat + service;
  const backendBase = process.env.REACT_APP_BACKEND_URL.replace(/\/api$/, '');

  /* ── helper that records the booking and routes to confirmation ── */
  const recordBookingAndGo = async () => {
    if (!licenseFile) {
      alert('Please upload your driver’s license.');
      return;
    }
    const form = new FormData();
    form.append('license', licenseFile);
    form.append('listingId', listingId);
    form.append('startDate', fromISO);
    form.append('endDate', toISO);
    form.append('basePrice', base);
    form.append('currency', 'GBP');
    form.append('bookingType', bookingType);
    if (affiliateCode.trim()) {
      form.append('affiliateCode', affiliateCode.trim());
    }

    const { data } = await api.post('/bookings', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const bookingId = data.booking?._id;
    navigate(`/payment/confirmation?bookingId=${bookingId}`);
  };

  /* ── Stripe handler ────────────────────────────────────────────── */
  const handleCardPayment = async () => {
    if (!idVerified) {
      alert('Please verify your driving licence before booking.');
      return;
    }
    if (processing) return;
    if (!message.trim()) {
      alert('Please leave a message to your local rental business before you pay.');
      return;
    }

    try {
      setProcessing(true);
      // 1) Create PaymentIntent
      const { data } = await api.post('/payment/stripe', {
        amount:   Math.round(total * 100),
        currency: 'GBP'
      });

      // 2) Confirm card payment
      const { error } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card: elements.getElement(CardElement) } }
      );
      if (error) {
        console.error('Stripe error:', error);
        alert(error.message);
        return;
      }

      // 3) Record booking (with license) and redirect
      await recordBookingAndGo();
    } catch (err) {
      console.error('Stripe payment error:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <header className={cls.header}>
        <div className={cls.logo} onClick={() => navigate('/')}>Hyre</div>
        <button className={cls.menuIcon} onClick={() => setMenuOpen(o => !o)}>☰</button>
      </header>

      <SideMenuCustomer
        isOpen={menuOpen}
        toggleMenu={() => setMenuOpen(o => !o)}
        closeMenu={() => setMenuOpen(false)}
      />

      {!idVerified && (
        <div style={{
          backgroundColor: '#ffdddd',
          color: '#a33',
          padding: '12px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {verificationError === 'name'
            ? 'Name does not match with name on ID.'
            : verificationError === 'dob'
            ? 'Date of birth does not match with date on ID.'
            : 'Please verify your driving licence before booking.'}
        </div>
      )}

      <div className={cls.container}>
        <div className={cls.columns}>

          {/* ───────── left column ───────── */}
          <div className={cls.left}>

            {/* payment method */}
            <div className={cls.section}>
              <h3>Payment method</h3>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={method === 'card'}
                  onChange={() => setMethod('card')}
                /> Card
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={method === 'paypal'}
                  onChange={() => setMethod('paypal')}
                /> PayPal
              </label>
            </div>

            {/* booking type */}
            <div className={cls.section}>
              <h3>Booking type</h3>
              <label>
                <input
                  type="radio"
                  name="bookingType"
                  value="refundable"
                  checked={bookingType === 'refundable'}
                  onChange={() => setBookingType('refundable')}
                />
                Refundable (£{listing.pricePerDay}/day)
              </label>
              <label>
                <input
                  type="radio"
                  name="bookingType"
                  value="nonRefundable"
                  checked={bookingType === 'nonRefundable'}
                  onChange={() => setBookingType('nonRefundable')}
                />
                Non-refundable (£{nfPrice.toFixed(2)}/day)
              </label>
            </div>

            {/* message */}
            <div className={cls.section}>
              <h3>Write a message to the host</h3>
              <textarea
                className={cls.textarea}
                placeholder="Say hi to your local rental business…"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            {/* affiliate code */}
            <div className={cls.section}>
              <h3>Affiliate Code (optional)</h3>
              <input
                type="text"
                className={cls.textInput}
                placeholder="Enter affiliate code"
                value={affiliateCode}
                onChange={e => setAffiliateCode(e.target.value)}
              />
            </div>

            {/* NEW: license upload */}
            <div className={cls.section}>
              <h3>Upload Driver’s License</h3>
              <input
                type="file"
                accept="image/*"
                onChange={e => setLicenseFile(e.target.files[0])}
              />
            </div>

            {/* Stripe */}
            {method === 'card' && (
              <div className={cls.section}>
                <CardElement options={{ hidePostalCode: true }} />
                <button
                  className={cls.payBtn}
                  onClick={handleCardPayment}
                  disabled={processing || !stripe || !elements || !idVerified}
                >
                  {processing ? 'Processing…' : `Pay £${total.toFixed(2)}`}
                </button>
              </div>
            )}

            {/* PayPal */}
            {method === 'paypal' && (
              <div className={cls.section}>
                <PayPalButtons
                  style={{ layout: 'vertical' }}
                  createOrder={(_d, actions) => {
                    if (!idVerified) {
                      alert('Please verify your driving licence before booking.');
                      return Promise.reject();
                    }
                    if (!message.trim()) {
                      alert('Please leave a message to your local rental business before you pay.');
                      return Promise.reject();
                    }
                    return api
                      .post('/payment/paypal/create-order', { amount: total.toFixed(2), currency: 'GBP' })
                      .then(r => r.data.orderID);
                  }}
                  onApprove={({ orderID }) =>
                    api.post('/payment/paypal/capture-order', { orderID })
                      .then(recordBookingAndGo)
                  }
                  onError={err => {
                    console.error('PayPal error:', err);
                    alert('PayPal checkout failed');
                  }}
                  forceReRender={[idVerified, message]}
                />
              </div>
            )}
          </div>

          {/* ───────── right column (summary) ───────── */}
          <div className={cls.right}>
            <img
              src={listing.images?.[0]
                ? `${backendBase}/${listing.images[0]}`
                : '/avatar.svg'
              }
              alt=""
              className={cls.thumb}
            />
            <h3>{listing.make} {listing.model}</h3>
            <div className={cls.rating}>
              {(listing.reviews?.length
                ? (listing.reviews.reduce((s, r) => s + (r.rating || 0), 0) / listing.reviews.length).toFixed(2)
                : '0.00'
              )}★ ({listing.reviews?.length || 0})
            </div>
            <p>
              Policy:{" "}
              {listing.cancellationPolicy === 'none'
                ? 'Non-refundable'
                : listing.cancellationPolicy === 'moderate'
                  ? 'Moderate'
                  : 'Strict'
              }{" "}
              · <a href="/legal">Full policy</a>
            </p>

            <div className={cls.section}>
              <h4>Trip details</h4>
              <p>
                {fromDate.toLocaleDateString()} → {toDate.toLocaleDateString()}<br/>
                {days} days
              </p>
              <button onClick={() => navigate(-1)}>Change</button>
            </div>

            <div className={cls.section}>
              <h4>Price details</h4>
              <div className={cls.breakdown}>
                <span>£{base.toFixed(2)} × {days} days</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className={cls.breakdown}>
                <span>Hyre service fee</span>
                <span>£{service.toFixed(2)}</span>
              </div>
              <div className={cls.breakdown}>
                <span>VAT (20%)</span>
                <span>£{vat.toFixed(2)}</span>
              </div>
              <hr/>
              <div className={cls.totalRow}>
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
