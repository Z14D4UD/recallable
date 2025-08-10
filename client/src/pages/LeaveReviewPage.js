// client/src/pages/LeaveReviewPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import styles from '../styles/LeaveReviewPage.module.css';

export default function LeaveReviewPage() {
  const navigate     = useNavigate();
  const { bookingId } = useParams();

  const token       = localStorage.getItem('token');
  const accountType = localStorage.getItem('accountType');

  /* ── HOOKS ────────────────────────────────────────────────────── */
  const [rating,      setRating]      = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment,     setComment]     = useState('');
  const [loading,     setLoading]     = useState(true);
  const [booking,     setBooking]     = useState(null);
  const [error,       setError]       = useState('');

  useEffect(() => {
    async function fetchBooking() {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        // ← server now returns the booking object itself
        setBooking(data);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Could not load booking information.');
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5.');
      return;
    }
    try {
      setError('');
      // include businessId so backend knows which listing to update
      await api.post('/reviews', {
        bookingId,
        businessId: booking.business._id,
        rating,
        comment
      });
      navigate('/bookings/customer');
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  /* ── EARLY RETURNS ───────────────────────────────────────────── */

  // 1) Must be a logged-in customer
  if (!token || accountType !== 'customer') {
    return (
      <div className={styles.container}>
        <p className={styles.guardText}>
          You must be logged in as a customer to leave a review.
        </p>
      </div>
    );
  }

  // 2) Still loading booking from the server
  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.guardText}>Loading booking details…</p>
      </div>
    );
  }

  // 3) If fetch finished but no booking returned
  if (!booking) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Booking not found.</p>
      </div>
    );
  }

  // 4) If a review already exists on this booking
  if (booking.hasReview) {
    return (
      <div className={styles.container}>
        <p className={styles.guardText}>
          You’ve already left a review for this booking.
        </p>
      </div>
    );
  }

  /* ── MAIN RENDER ─────────────────────────────────────────────── */

  // derive title from make + model
  const carTitle = booking.car?.make && booking.car?.model
    ? `${booking.car.make} ${booking.car.model}`
    : 'Unknown';

  const hostName = booking.business?.name ?? 'Host';
  const rawStart = new Date(booking.startDate);
  const rawEnd   = new Date(booking.endDate);

  const formattedStartDate = rawStart.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
  const formattedStartTime = rawStart.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  });
  const formattedEndDate = rawEnd.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
  const formattedEndTime = rawEnd.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  });

  // ◀─ derive API root and build direct uploads URL
  const apiRoot = api.defaults.baseURL.replace(/\/api\/?$/, '');
  const vehicleImgUrl = booking.car?.images?.[0]
    ? `${apiRoot}/uploads/${booking.car.images[0]}`
    : '/avatar.svg';

  return (
    <div className={styles.container}>
      {/* Car & Host */}
      <h1 className={styles.title}>{carTitle}</h1>
      <p className={styles.hostedBy}>Hosted by {hostName}</p>

      {/* Vehicle image */}
      <div className={styles.vehicleImageWrapper}>
        <img
          src={vehicleImgUrl}
          alt={carTitle}
          className={styles.vehicleImage}
        />
      </div>

      {/* 1) Finish your review card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Finish your review</h2>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = hoverRating >= star || rating >= star;
            return (
              <button
                key={star}
                type="button"
                className={filled ? styles.starFilled : styles.starEmpty}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                {filled ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="#38b6ff"
                  >
                    <path d="M12 .587l3.668 7.431L24 9.168l-6 5.847 
                             1.416 8.245L12 18.897l-7.416 4.363
                             L6 15.015 0 9.168l8.332-1.15z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="none"
                    stroke="#38b6ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 
                                     18.18 21.02 12 17.77 5.82 21.02 
                                     7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2) Check-in / Check-out card */}
      <div className={styles.datesCard}>
        <div className={styles.dateCol}>
          <p className={styles.dateLabel}>Check-in</p>
          <p className={styles.dateValue}>{formattedStartDate}</p>
          <p className={styles.timeValue}>{formattedStartTime}</p>
        </div>
        <div className={styles.divider} />
        <div className={styles.dateCol}>
          <p className={styles.dateLabel}>Check-out</p>
          <p className={styles.dateValue}>{formattedEndDate}</p>
          <p className={styles.timeValue}>{formattedEndTime}</p>
        </div>
      </div>

      {/* 3) Submission error */}
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.error}>{error}</p>
        </div>
      )}

      {/* 4) Comment section */}
      <div className={styles.commentSection}>
        <label htmlFor="comment" className={styles.commentLabel}>
          Comment:
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={styles.commentBox}
          rows={4}
          placeholder="Write your thoughts here…"
        />
      </div>

      {/* 5) Submit button */}
      <button onClick={handleSubmit} className={styles.submitBtn}>
        Submit
      </button>
    </div>
  );
}
