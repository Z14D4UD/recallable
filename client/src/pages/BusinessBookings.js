import React, { useState, useEffect } from 'react';
import axios                          from 'axios';
import { useNavigate }                from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar }                        from 'react-chartjs-2';
import SideMenuBusiness               from '../components/SideMenuBusiness';
import styles                         from '../styles/BusinessBookings.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const API = process.env.REACT_APP_BACKEND_URL;

export default function BusinessBookings() {
  const navigate         = useNavigate();
  const token            = localStorage.getItem('token') || '';
  const acctType         = (localStorage.getItem('accountType')||'').toLowerCase();
  const isBiz            = token && acctType === 'business';

  const [menuOpen,     setMenuOpen]      = useState(false);
  const [bookings,     setBookings]      = useState([]);
  const [monthlyData,  setMonthlyData]   = useState(Array(12).fill(0));
  const [counts,       setCounts]        = useState({
    upcoming: 0,
    pending: 0,
    active: 0,
    cancelRequested: 0,
    cancelled: 0
  });
  const [modalBooking, setModalBooking]  = useState(null);
  const [checkedID,    setCheckedID]     = useState(false);
  const [modalBusy,    setModalBusy]     = useState(false);
  const now             = new Date();

  useEffect(() => {
    if (!isBiz) {
      alert('Please log in as a business to view bookings.');
      navigate('/');
    }
  }, [isBiz, navigate]);

  // ─── fetch “my” bookings ─────────────────────────
  useEffect(() => {
    axios.get(`${API}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => setBookings(r.data))
    .catch(() => alert('Failed to fetch bookings.'));
  }, [API, token]);

  // ─── compute stats + monthly ─────────────────────
  useEffect(() => {
    const stats  = { upcoming:0, pending:0, active:0, cancelRequested:0, cancelled:0 };
    const months = Array(12).fill(0);

    bookings.forEach(b => {
      const ended = new Date(b.endDate) < now;
      let key;
      if (ended && b.status==='Active')      key = 'active';
      else if (b.status==='cancelRequested') key = 'cancelRequested';
      else if (b.status==='Cancelled')       key = 'cancelled';
      else                                   key = b.status.toLowerCase();

      if (stats[key] !== undefined) stats[key]++;
      months[new Date(b.startDate).getMonth()]++;
    });

    setCounts(stats);
    setMonthlyData(months);
  }, [bookings, now]);

  // ─── modal controls ──────────────────────────────
  const openModal  = (b, e) => {
    e.stopPropagation();
    setCheckedID(false);
    setModalBooking(b);
  };
  const closeModal = () => setModalBooking(null);

  const handleDecisionModal = async (newStatus) => {
    if (!checkedID) {
      alert('Please confirm you have checked the driver’s license.');
      return;
    }
    setModalBusy(true);
    try {
      await axios.patch(
        `${API}/bookings/${modalBooking._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(bs => bs.filter(x => x._id !== modalBooking._id));
      closeModal();
    } catch {
      alert('Failed to update booking');
    } finally {
      setModalBusy(false);
    }
  };

  // ─── render ──────────────────────────────────────
  return (
    <div className={styles.bookingsContainer}>

      {/* ── MODAL ───────────────────────────────────── */}
      {modalBooking && (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e=>e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={closeModal}>×</button>
            <h2>Booking Details</h2>

            {/* — Customer avatar, name & email  */}
            {modalBooking.customer?.avatarUrl && (
              <img
                src={`${API.replace(/\/api$/,'')}/${modalBooking.customer.avatarUrl}`}
                alt={modalBooking.customer.name}
                className={styles.modalAvatar}
              />
            )}
            <p><strong>Name:</strong>  {modalBooking.customer?.name}</p>
            <p><strong>Email:</strong> {modalBooking.customer?.email}</p>

            <p><strong>ID:</strong>  {modalBooking._id}</p>
            <p><strong>Car:</strong> {modalBooking.car.make} {modalBooking.car.model}</p>
            <p>
              <strong>Dates:</strong>{' '}
              {new Date(modalBooking.startDate).toLocaleDateString('en-GB')} →{' '}
              {new Date(modalBooking.endDate).toLocaleDateString('en-GB')}
            </p>
            <p><strong>Price:</strong> £{modalBooking.basePrice.toFixed(2)}</p>

            <div className={styles.modalSection}>
              <h3>Driver’s License</h3>
              <img
                src={`${API.replace(/\/api$/,'')}/${modalBooking.licenseUrl}`}
                alt="Driver’s License"
                className={styles.modalLicenseImg}
              />
            </div>

            <label className={styles.modalCheckboxLabel}>
              <input
                type="checkbox"
                checked={checkedID}
                onChange={e => setCheckedID(e.target.checked)}
              />
              I confirm I have checked the driver’s license
            </label>

            <div className={styles.modalButtons}>
              <button
                className={styles.approveBtn}
                disabled={modalBusy}
                onClick={() => handleDecisionModal('Active')}
              >Approve</button>
              <button
                className={styles.rejectBtn}
                disabled={modalBusy}
                onClick={() => handleDecisionModal('Cancelled')}
              >Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ── header & side menu ───────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={()=>navigate('/')}>Hyre</div>
        <button className={styles.menuIcon} onClick={()=>setMenuOpen(o=>!o)}>☰</button>
      </header>
      <SideMenuBusiness
        isOpen={menuOpen}
        toggleMenu={()=>setMenuOpen(o=>!o)}
        closeMenu={()=>setMenuOpen(false)}
      />

      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Bookings</h1>

        {/* ── stats row ─────────────────────────────────── */}
        <div className={styles.statsRow}>
          {[
            ['upcoming','Upcoming'],
            ['pending','Pending'],
            ['active','Active'],
            ['cancelRequested','Cancellation Requests'],
            ['cancelled','Cancelled']
          ].map(([key,label])=>(
            <div key={key} className={styles.statCard}>
              <h3>{label}</h3>
              <p>{counts[key]}</p>
            </div>
          ))}
        </div>

        {/* ── chart + table ─────────────────────────────── */}
        <div className={styles.middleSection}>

          {/* Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2>Bookings Overview</h2>
              <span>Last 12 Months</span>
            </div>
            <div className={styles.chartWrapper}>
              <Bar
                data={{
                  labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                  datasets:[{ data: monthlyData, backgroundColor: '#38b6ff' }]
                }}
                options={{ responsive:true, plugins:{ legend:{ display:false } } }}
              />
            </div>
          </div>

          {/* Table */}
          <section className={styles.tableSection}>
            <h2 className={styles.tableTitle}>Bookings List</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.bookingsTable}>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Car</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan="8" style={{textAlign:'center'}}>No bookings found.</td></tr>
                  ) : bookings.map(b => {
                    const ended = new Date(b.endDate) < now;
                    let displayStatus;
                    if (ended && b.status==='Active')        displayStatus = 'Completed';
                    else if (b.status==='cancelRequested')   displayStatus = 'Cancellation request';
                    else                                      displayStatus = b.status;

                    const canDelete = ['completed','cancelled'].includes(displayStatus.toLowerCase());

                    return (
                      <tr
                        key={b._id}
                        style={{ cursor:'pointer' }}
                        onClick={() => navigate(`/bookings/${b._id}`)}
                      >
                        <td>{b._id}</td>
                        <td>{b.customerName}</td>
                        <td>{b.car ? `${b.car.make} ${b.car.model}` : 'N/A'}</td>
                        <td>{new Date(b.startDate).toLocaleDateString('en-GB')}</td>
                        <td>{new Date(b.endDate).toLocaleDateString('en-GB')}</td>
                        <td>£{b.basePrice.toFixed(2)}</td>
                        <td>
                          <span
                            className={`
                              ${styles.statusBadge}
                              ${
                                b.status==='cancelRequested'
                                  ? styles.cancelrequested
                                  : styles[displayStatus.toLowerCase()]
                              }
                            `}
                          >
                            {displayStatus}
                          </span>
                        </td>
                        <td className={styles.actionCell}>
                          {['Pending','cancelRequested'].includes(b.status) ? (
                            <button
                              className={styles.viewBtn}
                              onClick={e => openModal(b, e)}
                            >
                              View
                            </button>
                          ) : canDelete ? (
                            <span
                              className={styles.deleteIcon}
                              onClick={() => {
                                if (!window.confirm('Delete this booking?')) return;
                                axios.delete(`${API}/bookings/${b._id}`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                })
                                .then(() => setBookings(bs => bs.filter(x => x._id !== b._id)))
                                .catch(() => alert('Delete failed.'));
                              }}
                            >
                              ×
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
