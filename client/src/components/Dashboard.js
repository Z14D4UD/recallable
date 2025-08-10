// client/src/components/BusinessDashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

import SideMenuBusiness from './SideMenuBusiness';
import styles from '../styles/Dashboard.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue:     0,
    bookings:         0,
    rentedCars:       0,
    activeCars:       0,
    availableBalance: 0,
    pendingBalance:   0,
    points:           0,   // ← NEW: business points
    rentStatus: {
      hired:     0,
      pending:   0,
      cancelled: 0
    }
  });
  const [earningsData, setEarningsData] = useState([]);
  const [bookingsOverviewData, setBookingsOverviewData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reminders, setReminders] = useState([]);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDescription, setNewReminderDescription] = useState('');
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  const [refunds, setRefunds] = useState([]);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundActionType, setRefundActionType] = useState(null);

  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');

  const navigate = useNavigate();
  const token = (localStorage.getItem('token') || '').trim();
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
  const baseUrl = process.env.REACT_APP_BACKEND_URL;

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: statsData } = await axios.get(
          `${baseUrl}/business/stats`,
          axiosConfig
        );
        setStats(prev => ({
          ...prev,
          ...statsData,
          rentStatus: statsData.rentStatus ?? prev.rentStatus
        }));

        const { data: earn } = await axios.get(
          `${baseUrl}/business/earnings`,
          axiosConfig
        );
        setEarningsData(earn);

        const { data: over } = await axios.get(
          `${baseUrl}/business/bookingsOverview`,
          axiosConfig
        );
        setBookingsOverviewData(over);

        const { data: refunds } = await axios.get(
          `${baseUrl}/bookings/refunds`,
          axiosConfig
        );
        setRefunds(refunds);

        const { data: rem } = await axios.get(
          `${baseUrl}/reminders`,
          axiosConfig
        );
        setReminders(rem);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          console.error('Error fetching dashboard data:', err);
        }
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchData();
  }, [token, baseUrl, navigate]);

  const earningsChartData = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    datasets: [{
      label: 'Earnings ($)',
      data: earningsData,
      fill: false,
      borderColor: '#4f3cc9',
      tension: 0.1
    }]
  };

  const bookingsOverviewChartData = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    datasets: [{
      label: 'Bookings',
      data: bookingsOverviewData,
      backgroundColor: '#4f3cc9'
    }]
  };

  const rentStatusData = {
    labels: ['Hired','Pending','Cancelled'],
    datasets: [{
      data: [
        stats.rentStatus.hired,
        stats.rentStatus.pending,
        stats.rentStatus.cancelled
      ],
      backgroundColor: ['#2ecc71','#f1c40f','#e74c3c']
    }]
  };

  const totalStatus = stats.rentStatus.hired + stats.rentStatus.pending + stats.rentStatus.cancelled;
  const pct = n => totalStatus ? Math.round((n / totalStatus) * 100) : 0;

  const handleWithdrawalSubmit = async () => {
    const amt = parseFloat(withdrawalAmount);
    if (isNaN(amt) || amt <= 0) {
      return alert('Please enter a valid withdrawal amount.');
    }
    if (withdrawalMethod === 'bank') {
      localStorage.setItem('pendingWithdrawalAmount', withdrawalAmount);
      return navigate('/connect-bank');
    }
    try {
      await axios.post(
        `${baseUrl}/withdrawals`,
        { amount: amt, method: 'paypal', details: { paypalEmail } },
        axiosConfig
      );
      alert('Withdrawal request submitted successfully!');
      setWithdrawalModalOpen(false);
    } catch (err) {
      console.error('Error submitting withdrawal:', err);
      alert('Failed to submit withdrawal request.');
    }
  };

  const handleAddReminder = async e => {
    e.preventDefault();
    if (!newReminderTitle) return alert('Please enter a title for the reminder.');
    try {
      const { data } = await axios.post(
        `${baseUrl}/reminders`,
        { title: newReminderTitle, description: newReminderDescription },
        axiosConfig
      );
      setReminders(data.reminders);
      setNewReminderTitle('');
      setNewReminderDescription('');
    } catch (err) {
      console.error('Error adding reminder:', err);
      alert('Failed to add reminder.');
    }
  };

  const handleEditReminder = r => {
    setEditingReminderId(r._id);
    setEditingTitle(r.title);
    setEditingDescription(r.description);
  };
  const handleUpdateReminder = async id => {
    try {
      const { data } = await axios.put(
        `${baseUrl}/reminders/${id}`,
        { title: editingTitle, description: editingDescription },
        axiosConfig
      );
      setReminders(data.reminders);
      setEditingReminderId(null);
    } catch (err) {
      console.error('Error updating reminder:', err);
      alert('Failed to update reminder.');
    }
  };
  const handleDeleteReminder = async id => {
    try {
      const { data } = await axios.delete(`${baseUrl}/reminders/${id}`, axiosConfig);
      setReminders(data.reminders);
    } catch (err) {
      console.error('Error deleting reminder:', err);
      alert('Failed to delete reminder.');
    }
  };

  const openRefundModal = (r, action) => {
    setSelectedRefund(r);
    setRefundActionType(action);
  };
  const closeRefundModal = () => {
    setSelectedRefund(null);
    setRefundActionType(null);
  };
  const confirmRefundAction = async () => {
    if (!selectedRefund || !refundActionType) return;
    try {
      const action = refundActionType === 'accept' ? 'approved' : 'rejected';
      await axios.patch(
        `${baseUrl}/bookings/refunds/${selectedRefund._id}`,
        { action },
        axiosConfig
      );
      alert(`Refund ${action}ed ✅`);
      setRefunds(prev => prev.filter(r => r._id !== selectedRefund._id));
      closeRefundModal();
    } catch (err) {
      console.error('Error processing refund action:', err);
      alert('Failed to process refund action.');
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <header className={styles.header}>
          <div className={styles.logo} onClick={() => navigate('/')}>Hyre</div>
          <button className={styles.menuIcon} onClick={toggleMenu}>☰</button>
        </header>
        <div className={styles.mainContent}>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/')} style={{ color: '#38b6ff' }}>
          Hyre
        </div>
        <button className={styles.menuIcon} onClick={toggleMenu}>☰</button>
      </header>

      <SideMenuBusiness isOpen={menuOpen} toggleMenu={toggleMenu} closeMenu={closeMenu} />

      <div className={styles.mainContent}>
        {/* Stats Cards */}
        <div className={styles.statsCards}>
          <div className={styles.card}><h3>Total Revenue</h3><p>${stats.totalRevenue.toLocaleString()}</p></div>
          <div className={styles.card}><h3>Bookings</h3><p>{stats.bookings}</p></div>
          <div className={styles.card}><h3>Rented Cars</h3><p>{stats.rentedCars}</p></div>
          <div className={styles.card}><h3>Active Cars</h3><p>{stats.activeCars}</p></div>
          <div className={styles.card}><h3>Points</h3><p>{stats.points}</p></div>
          <div className={styles.card}>
            <h3>Available Balance</h3>
            <p>${stats.availableBalance.toFixed(2)}</p>
            <button
              className={`${styles.withdrawButton} ${styles.roundButton}`}
              onClick={() => setWithdrawalModalOpen(true)}
            >
              Withdraw
            </button>
          </div>
          <div className={styles.card}>
            <h3>Pending Payouts</h3>
            <p>${stats.pendingBalance.toFixed(2)}</p>
            <small>Held until pickup date</small>
          </div>
        </div>

        {/* Charts */}
        <div className={styles.row}>
          <div className={styles.leftColumn}>
            <div className={styles.chartCard}><h2>Earnings Summary</h2><Line data={earningsChartData} /></div>
            <div className={styles.chartCard}><h2>Bookings Overview</h2><Bar data={bookingsOverviewChartData} /></div>
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.chartCard}>
              <h2>Rent Status</h2>
              <Doughnut data={rentStatusData} />
              <div className={styles.rentStatusLabels}>
                <div>Hired <span>{pct(stats.rentStatus.hired)}%</span></div>
                <div>Pending <span>{pct(stats.rentStatus.pending)}%</span></div>
                <div>Cancelled <span>{pct(stats.rentStatus.cancelled)}%</span></div>
              </div>
            </div>

            {/* Refund Requests */}
            <div className={styles.card}>
              <h3 className={styles.sectionHeading}>Refund Requests</h3>
              {refunds.length === 0 ? (
                <p>No cancellation requests at this time.</p>
              ) : (
                <table className={styles.refundTable}>
                  <thead>
                    <tr><th>Customer</th><th>Car</th><th>Status</th><th>Requested On</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {refunds.map((r) => (
                      <tr key={r._id}>
                        <td>{r.customer.name}</td>
                        <td>{r.booking.car?.make} {r.booking.car?.model}</td>
                        <td>{r.status}</td>
                        <td>{new Date(r.requestedAt).toLocaleDateString('en-GB')}</td>
                        <td>
                          <button className={styles.buttonPrimary} onClick={() => openRefundModal(r, 'accept')}>Approve</button>
                          <button className={styles.buttonDanger} onClick={() => openRefundModal(r, 'reject')}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Reminders */}
            <div className={styles.remindersCard}>
              <h2>Reminders</h2>
              <form onSubmit={handleAddReminder} className={styles.reminderForm}>
                <input type="text" placeholder="Title" value={newReminderTitle} onChange={e => setNewReminderTitle(e.target.value)} />
                <input type="text" placeholder="Description" value={newReminderDescription} onChange={e => setNewReminderDescription(e.target.value)} />
                <button type="submit">Add Reminder</button>
              </form>
              <ul className={styles.reminderList}>
                {reminders.map(r => (
                  <li key={r._id}>
                    {editingReminderId === r._id ? (
                      <>
                        <input type="text" value={editingTitle} onChange={e => setEditingTitle(e.target.value)} />
                        <input type="text" value={editingDescription} onChange={e => setEditingDescription(e.target.value)} />
                        <button onClick={() => handleUpdateReminder(r._id)}>Save</button>
                        <button onClick={() => setEditingReminderId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <strong>{r.title}</strong> – {r.description}
                        <button onClick={() => handleEditReminder(r)}>Edit</button>
                        <button onClick={() => handleDeleteReminder(r._id)}>Delete</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Withdrawal Modal */}
        {withdrawalModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>Withdraw Funds</h2>
              <label>Amount</label>
              <input type="number" value={withdrawalAmount} onChange={e => setWithdrawalAmount(e.target.value)} placeholder="Enter amount" />
              <label>Withdrawal Method</label>
              <select value={withdrawalMethod} onChange={e => setWithdrawalMethod(e.target.value)}>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank Account</option>
              </select>
              {withdrawalMethod === 'paypal' && (
                <>
                  <label>PayPal Email</label>
                  <input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="Enter your PayPal email" />
                </>
              )}
              <div className={styles.modalButtons}>
                <button className={styles.buttonPrimary} onClick={handleWithdrawalSubmit}>Submit Withdrawal</button>
                <button className={styles.buttonDanger} onClick={() => setWithdrawalModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Confirmation Modal */}
        {selectedRefund && refundActionType && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>Refund Confirmation</h2>
              <p>Are you sure you want to {refundActionType === 'accept' ? 'approve' : 'reject'} the refund for <strong>{selectedRefund.customer.name}</strong>?</p>
              <div className={styles.modalButtons}>
                <button className={styles.buttonPrimary} onClick={confirmRefundAction}>Yes</button>
                <button className={styles.buttonDanger} onClick={closeRefundModal}>No</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
