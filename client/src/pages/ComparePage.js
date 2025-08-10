import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import SideMenuCustomer from '../components/SideMenuCustomer';
import SideMenuBusiness from '../components/SideMenuBusiness';
import SideMenuAffiliate from '../components/SideMenuAffiliate';

import styles from '../styles/ComparePage.module.css';

export default function ComparePage() {
  const [searchParams]    = useSearchParams();
  const ids               = (searchParams.get('ids') || '').split(',').filter(Boolean);
  const [items, setItems] = useState([]);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const token             = localStorage.getItem('token') || '';
  const accountType       = (localStorage.getItem('accountType') || '').toLowerCase();
  const navigate          = useNavigate();
  const API_ROOT          = process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, '');

  useEffect(() => {
    if (!ids.length) return;
    (async () => {
      try {
        const res = await axios.get(`${API_ROOT}/cars/compare`, {
          params: { ids: ids.join(',') },
        });
        setItems(res.data);
      } catch (e) {
        console.error('Failed to load compare data', e);
      }
    })();
  }, [ids, API_ROOT]);

  let Side = <></>;
  if (token) {
    if (accountType === 'business') {
      Side = <SideMenuBusiness isOpen={sideMenuOpen} toggleMenu={() => setSideMenuOpen(o=>!o)} closeMenu={() => setSideMenuOpen(false)} />;
    } else if (accountType === 'affiliate') {
      Side = <SideMenuAffiliate isOpen={sideMenuOpen} toggleMenu={() => setSideMenuOpen(o=>!o)} closeMenu={() => setSideMenuOpen(false)} />;
    } else {
      Side = <SideMenuCustomer isOpen={sideMenuOpen} toggleMenu={() => setSideMenuOpen(o=>!o)} closeMenu={() => setSideMenuOpen(false)} />;
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.logo} onClick={() => navigate('/')}>Hyre</span>
        <button className={styles.menuIcon} onClick={() => setSideMenuOpen(o=>!o)}>☰</button>
      </header>
      {Side}

      <main className={styles.main}>
        <h1>Compare Cars</h1>
        {items.length < 2 && <p>Select at least two cars or listings to compare.</p>}

        {items.length >= 2 && (
          <div className={styles.cardsContainer}>
            {items.map(c => {
              const imgSrc = c.imageUrl
                ? `${API_ROOT}/${c.imageUrl}`
                : (c.images && c.images[0])
                  ? `${API_ROOT}/${c.images[0]}`
                  : '/placeholder.jpg';

              return (
                <div
                  key={c._id}
                  className={styles.card}
                  onClick={() => navigate(`/details/listing/${c._id}`)}
                >
                  <img
                    src={imgSrc}
                    alt={`${c.carMake||c.title} ${c.model||''}`}
                    className={styles.cardImage}
                  />

                  <div className={styles.cardInfo}>
                    <h2 className={styles.cardTitle}>
                      {c.carMake
                        ? `${c.carMake} ${c.model}`
                        : c.title}
                    </h2>
                    <p className={styles.cardLocation}>
                      {c.location || c.address || '–'}
                    </p>
                    <p className={styles.cardPrice}>
                      £{(c.pricePerDay || 0).toFixed(2)}/day
                    </p>

                    <ul className={styles.detailsList}>
                      <li><strong>Year:</strong> {c.year || '–'}</li>
                      <li><strong>Mileage:</strong> {c.mileage != null ? `${c.mileage.toLocaleString()} mi` : '–'}</li>
                      <li><strong>Features:</strong> {c.features && c.features.length ? c.features.join(', ') : '–'}</li>
                      <li><strong>Description:</strong> {c.description || '–'}</li>
                    </ul>

                    <button
                      className={styles.bookButton}
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/details/listing/${c._id}`);
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
