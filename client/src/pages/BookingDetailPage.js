import React, { useState, useEffect } from 'react';
import { useParams, useNavigate }      from 'react-router-dom';
import api                              from '../api';
import SideMenuBusiness                 from '../components/SideMenuBusiness';
import styles                           from '../styles/BookingDetailPage.module.css';

export default function BookingDetailPage({
  bookingId: propBookingId,
  isModal = false
}) {
  // pick up either the explicit prop (modal) or the :id param
  const { id: idFromParams } = useParams();
  const id                   = propBookingId || idFromParams;
  const navigate             = useNavigate();
  const token                = localStorage.getItem('token') || '';

  const [menuOpen, setMenuOpen] = useState(false);
  const [booking,  setBooking]  = useState(null);
  const [checked,  setChecked]  = useState(false);
  const [busy,     setBusy]     = useState(false);

  useEffect(() => {
    api.get(`/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => setBooking(r.data))
    .catch(() => alert('Failed to load booking'));
  }, [id, token]);

  const handleDecision = (newStatus) => {
    if (!checked) {
      alert('Please confirm you have checked the driver’s license.');
      return;
    }
    setBusy(true);
    api.patch(
      `/bookings/${id}/status`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(() => navigate('/bookings/business'))
    .catch(() => alert('Failed to update booking'))
    .finally(() => setBusy(false));
  };

  if (!booking) return <p>Loading…</p>;

  const avatarSrc = booking.customer?.avatarUrl
    ? `${process.env.REACT_APP_BACKEND_URL.replace(/\/api$/,'')}/${booking.customer.avatarUrl}`
    : null;

  const licenseSrc =
    `${process.env.REACT_APP_BACKEND_URL.replace(/\/api$/,'')}/${booking.licenseUrl}`;

  return (
    <div className={styles.container}>
      {!isModal && (
        <>
          <header className={styles.header}>
            <div className={styles.logo} onClick={() => navigate('/')}>Hyre</div>
            <button className={styles.menuIcon} onClick={() => setMenuOpen(o=>!o)}>☰</button>
          </header>

          <SideMenuBusiness
            isOpen={menuOpen}
            toggleMenu={() => setMenuOpen(o=>!o)}
            closeMenu={() => setMenuOpen(false)}
          />
        </>
      )}

      <main className={styles.main}>
        <h1>Booking Details</h1>

        {/* ─── Customer Info ─────────────────────────── */}
        {avatarSrc && (
          <div className={styles.customerInfo}>
            <img src={avatarSrc} alt={booking.customer.name} className={styles.avatar} />
            <div>
              <p><strong>Name:</strong>  {booking.customer.name}</p>
              <p><strong>Email:</strong> {booking.customer.email}</p>
            </div>
          </div>
        )}

        <p><strong>Booking ID:</strong> {booking._id}</p>
        <p><strong>Car:</strong>        {booking.car.make} {booking.car.model}</p>
        <p>
          <strong>Dates:</strong>{' '}
          {new Date(booking.startDate).toLocaleDateString()} →{' '}
          {new Date(booking.endDate).toLocaleDateString()}
        </p>
        <p><strong>Price:</strong>      £{booking.basePrice.toFixed(2)}</p>

        <div className={styles.section}>
          <h3>Driver’s License</h3>
          <img src={licenseSrc} alt="Driver’s License" className={styles.licenseImg} />
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
          />
          I confirm I have checked the driver’s license
        </label>

        <div className={styles.buttons}>
          <button
            disabled={busy}
            className={styles.approveBtn}
            onClick={() => handleDecision('Active')}
          >
            Approve
          </button>
          <button
            disabled={busy}
            className={styles.rejectBtn}
            onClick={() => handleDecision('Cancelled')}
          >
            Reject
          </button>
        </div>
      </main>
    </div>
  );
}
