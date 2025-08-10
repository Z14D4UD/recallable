// client/src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate }        from 'react-router-dom';
import axios                  from 'axios';
import SideMenuBusiness       from '../components/SideMenuBusiness';
import styles                 from '../styles/AdminDashboard.module.css';

export default function AdminDashboard() {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [stats,       setStats]       = useState(null);
  const [businesses,  setBusinesses]  = useState(null);
  const navigate                   = useNavigate();
  const token                      = localStorage.getItem('token');
  const accountType                = localStorage.getItem('accountType');

  // guard on client
  useEffect(() => {
    if (!token || accountType !== 'admin') {
      alert('Admin login required');
      navigate('/login');
    }
  }, [token, accountType, navigate]);

  // fetch stats
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/admin/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to load admin stats');
      }
    })();
  }, [token]);

  // fetch business list
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/admin/businesses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBusinesses(res.data.businesses);
      } catch (err) {
        console.error(err);
        alert('Failed to load businesses');
      }
    })();
  }, [token]);

  const handleWithdraw = async () => {
    if (!window.confirm('Withdraw all platform fees to company bank account?')) return;
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/admin/withdraw`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Withdrawal initiated.');
      // re-fetch stats
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/admin/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(res.data);
    } catch (err) {
      console.error(err);
      alert('Withdrawal failed.');
    }
  };

  if (!stats || !businesses) {
    return <p style={{ padding: '2rem' }}>Loading…</p>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Hyre Admin</div>
        <button className={styles.menuIcon} onClick={() => setMenuOpen(o=>!o)}>☰</button>
      </header>

      <SideMenuBusiness 
        isOpen={menuOpen} 
        toggleMenu={() => setMenuOpen(o=>!o)} 
        closeMenu={() => setMenuOpen(false)} 
      />

      <main className={styles.main}>
        <h1>Platform Overview</h1>
        <button className={styles.withdrawBtn} onClick={handleWithdraw}>
          Withdraw Fees
        </button>
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>Total Bookings</h3>
            <p>{stats.totalBookings}</p>
          </div>
          <div className={styles.card}>
            <h3>Total Cancellations</h3>
            <p>{stats.totalCancellations}</p>
          </div>
          <div className={styles.card}>
            <h3>Total Booking-Fees</h3>
            <p>£{stats.totalBookingFees.toFixed(2)}</p>
          </div>
          <div className={styles.card}>
            <h3>Total Service-Fees</h3>
            <p>£{stats.totalServiceFees.toFixed(2)}</p>
          </div>
          <div className={styles.card}>
            <h3>Total Revenue</h3>
            <p>£{stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className={styles.card}>
            <h3>Customers</h3>
            <p>{stats.totalCustomers}</p>
          </div>
          <div className={styles.card}>
            <h3>Businesses</h3>
            <p>{stats.totalBusinesses}</p>
          </div>
          <div className={styles.card}>
            <h3>Affiliates</h3>
            <p>{stats.totalAffiliates}</p>
          </div>
        </div>

        <section className={styles.businessSection}>
          <h2>All Businesses</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.businessTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Approved To Drive</th>
                  <th>Pending Balance</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map(b => (
                  <tr key={b._id}>
                    <td>{b.name}</td>
                    <td>{b.email}</td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td>{b.approvedToDrive ? 'Yes' : 'No'}</td>
                    <td>£{b.pendingBalance?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
