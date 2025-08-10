import React, { useState, useEffect } from 'react';
import { useNavigate }                from 'react-router-dom';
import axios                          from 'axios';
import {
  FaHome,
  FaTachometerAlt,
  FaUser,
  FaListUl,
  FaPlusSquare,
  FaClipboardList,
  FaEnvelope,
  FaSignOutAlt
} from 'react-icons/fa';
import styles                         from '../styles/SideMenuBusiness.module.css';

export default function SideMenuBusiness({ isOpen, toggleMenu, closeMenu }) {
  const navigate         = useNavigate();
  const token            = localStorage.getItem('token') || '';
  const API              = process.env.REACT_APP_BACKEND_URL;

  const [pendingCount,   setPendingCount]   = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    // 1) count pending bookings
    axios.get(`${API}/bookings/my`, { headers })
      .then(res => {
        const pend = res.data.filter(b => b.status === 'Pending').length;
        setPendingCount(pend);
      })
      .catch(() => { /* ignore */ });

    // 2) count unread conversations
    axios.get(`${API}/chat/conversations`, { headers })
      .then(res => {
        const unread = res.data.filter(c => c.unreadCount > 0).length;
        setUnreadMsgCount(unread);
      })
      .catch(() => { /* ignore */ });
  }, [API, token]);

  const handleLogout = () => {
    closeMenu();
    localStorage.removeItem('token');
    localStorage.removeItem('accountType');
    alert('You have logged out.');
    setTimeout(() => {
      navigate('/');
      window.location.reload();
    }, 500);
  };

  const goTo = path => {
    closeMenu();
    navigate(path);
  };

  return (
    <div className={`${styles.sideMenu} ${isOpen ? styles.open : ''}`}>
      <div className={styles.menuHeader}>
        <button className={styles.closeIcon} onClick={toggleMenu}>&times;</button>
      </div>
      <ul className={styles.menuList}>
        <li className={styles.menuItem} onClick={() => goTo('/')}>
          <FaHome className={styles.icon} />
          <span>Home</span>
        </li>
        <li className={styles.menuItem} onClick={() => goTo('/dashboard/business')}>
          <FaTachometerAlt className={styles.icon} />
          <span>Dashboard</span>
        </li>
        <li className={styles.menuItem} onClick={() => goTo('/profile/business')}>
          <FaUser className={styles.icon} />
          <span>My Profile</span>
        </li>
        <li className={styles.menuItem} onClick={() => goTo('/my-listings')}>
          <FaListUl className={styles.icon} />
          <span>My Listings</span>
        </li>
        <li className={styles.menuItem} onClick={() => goTo('/add-listing')}>
          <FaPlusSquare className={styles.icon} />
          <span>Add New Listing</span>
        </li>
        <li className={styles.menuItem} onClick={() => goTo('/bookings/business')}>
          <FaClipboardList className={styles.icon} />
          <span>Bookings</span>
          {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
        </li>
        <li className={styles.menuItem} onClick={() => goTo('/messages/business')}>
          <FaEnvelope className={styles.icon} />
          <span>Messages</span>
          {unreadMsgCount > 0 && <span className={styles.badge}>{unreadMsgCount}</span>}
        </li>
        <li className={styles.menuItem} onClick={handleLogout}>
          <FaSignOutAlt className={styles.icon} />
          <span>Log Out</span>
        </li>
      </ul>
    </div>
);
}
