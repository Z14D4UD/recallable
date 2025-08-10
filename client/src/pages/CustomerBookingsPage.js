//CustomerBookingsPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import SideMenuCustomer from '../components/SideMenuCustomer';
import styles from '../styles/CustomerBookingsPage.module.css';

export default function CustomerBookingsPage() {
  const navigate    = useNavigate();
  const token       = localStorage.getItem('token');
  const accountType = localStorage.getItem('accountType');
  const isCustomer  = Boolean(token && accountType === 'customer');

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [pending,    setPending]    = useState([]);
  const [active,     setActive]     = useState([]);
  const [past,       setPast]       = useState([]);
  const [cancelled,  setCancelled]  = useState([]);
  const [confirmId,  setConfirmId]  = useState(null);

  const backend = process.env.REACT_APP_BACKEND_URL.replace(/\/api$/, '');

  const toggleMenu         = () => setMenuOpen(o => !o);
  const handleOpenConfirm  = id => setConfirmId(id);
  const handleCloseConfirm = () => setConfirmId(null);

  function refreshLists(data) {
    const now = Date.now();
    const P = [], A = [], H = [], C = [];

    data.forEach(b => {
      if (!b.car) return;
      const img = Array.isArray(b.car.images) && b.car.images.length
        ? `${backend}/${b.car.images[0]}`
        : '/avatar.svg';

      const card = {
        id:              b._id,
        location:        `${b.car.make} ${b.car.model}`.trim() || '—',
        hostName:        b.business?.name || 'Host',
        startDate:       new Date(b.startDate).toLocaleDateString('en-GB'),
        endDate:         new Date(b.endDate).toLocaleDateString('en-GB'),
        imageUrl:        img,
        hasReview:       b.hasReview || false,
        isCancelPending: b.status === 'cancelRequested',
        isCancelled:     b.status === 'Cancelled',
        refundable:      b.refundable
      };

      if (b.status === 'Pending') {
        P.push(card);
      } else if (b.status === 'Cancelled') {
        C.push(card);
      } else if (b.status === 'cancelRequested') {
        A.push(card);
      } else if (new Date(b.endDate).getTime() < now) {
        H.push(card);
      } else {
        A.push(card);
      }
    });

    setPending(P);
    setCancelled(C);
    setActive(A);
    setPast(H);
  }

  const fetchBookings = useCallback(async () => {
    if (!isCustomer) return;
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/customer');
      refreshLists(data);
    } catch (err) {
      console.error('Booking fetch error:', err);
      if (err.response?.status !== 401) {
        alert('Failed to load your bookings.');
      }
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    if (!isCustomer) {
      alert('Please log in as a customer to view your bookings.');
      navigate('/');
      return;
    }
    fetchBookings();
    const iv = setInterval(fetchBookings, 30000);
    return () => clearInterval(iv);
  }, [isCustomer, navigate, fetchBookings]);

  const handleConfirmCancel = async id => {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      alert('Cancellation requested. Waiting for business approval.');
      handleCloseConfirm();
      await fetchBookings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to request cancellation.');
      handleCloseConfirm();
    }
  };

  if (!isCustomer) {
    return <div className={styles.loading}>Loading bookings…</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/')}>Hyre</div>
        <button className={styles.menuIcon} onClick={toggleMenu}>☰</button>
      </header>

      <SideMenuCustomer
        isOpen={menuOpen}
        toggleMenu={toggleMenu}
        closeMenu={toggleMenu}
      />

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Bookings</h1>
          <button
            className={styles.refreshBtn}
            onClick={fetchBookings}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {pending.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Pending Approval</h2>
            <div className={styles.bookingGrid}>
              {pending.map(b => (
                <div key={b.id} className={styles.bookingCard}>
                  <img src={b.imageUrl} alt="" className={styles.bookingImage} />
                  <div className={styles.bookingInfo}>
                    <h3>{b.location}</h3>
                    <p>Hosted by {b.hostName}</p>
                    <p>{b.startDate} – {b.endDate}</p>
                    <p style={{ color:'orange', fontWeight:'bold' }}>
                      Awaiting host approval
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {active.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Active Bookings</h2>
            <div className={styles.bookingGrid}>
              {active.map(b => (
                <div key={b.id} className={styles.bookingCard}>
                  <img src={b.imageUrl} alt="" className={styles.bookingImage} />
                  <div className={styles.bookingInfo}>
                    <h3>{b.location}</h3>
                    <p>{b.startDate} – {b.endDate}</p>
                    {b.isCancelPending ? (
                      <p style={{ color:'orange',fontWeight:'bold' }}>
                        Cancellation in progress
                      </p>
                    ) : b.refundable ? (
                      <button
                        className={styles.cancelButton}
                        onClick={() => handleOpenConfirm(b.id)}
                      >
                        Cancel Booking
                      </button>
                    ) : (
                      <p style={{ color:'#888' }}>Non-refundable</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {cancelled.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Cancelled Bookings</h2>
            <div className={styles.bookingGrid}>
              {cancelled.map(b => (
                <div key={b.id} className={styles.bookingCard}>
                  <img src={b.imageUrl} alt="" className={styles.bookingImage} />
                  <div className={styles.bookingInfo}>
                    <h3>{b.location}</h3>
                    <p>{b.startDate} – {b.endDate}</p>
                    <p style={{ color:'red',fontWeight:'bold' }}>
                      Booking was cancelled
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Your past bookings</h2>
            <div className={styles.bookingGrid}>
              {past.map(b => (
                <div key={b.id} className={styles.bookingCard}>
                  <img src={b.imageUrl} alt="" className={styles.bookingImage} />
                  <div className={styles.bookingInfo}>
                    <h3>{b.location}</h3>
                    <p>{b.startDate} – {b.endDate}</p>
                    <button
                      className={styles.leaveReview}
                      onClick={() => navigate(`/review/${b.id}`)}
                    >
                      Leave review →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {confirmId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Are you sure?</h2>
            <div className={styles.modalButtons}>
              <button
                className={styles.buttonPrimary}
                onClick={() => handleConfirmCancel(confirmId)}
              >
                Yes
              </button>
              <button
                className={styles.buttonDanger}
                onClick={handleCloseConfirm}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
