// client/src/pages/FavoritesPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// side-menus
import SideMenu from '../components/SideMenu';
import SideMenuCustomer from '../components/SideMenuCustomer';
import SideMenuBusiness from '../components/SideMenuBusiness';
import SideMenuAffiliate from '../components/SideMenuAffiliate';

// reuse your grid + card styles
import styles from '../styles/SearchResultsPage.module.css';

export default function FavoritesPage() {
  const navigate = useNavigate();

  // side-menu state
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const token = localStorage.getItem('token') || '';
  const accountType = (localStorage.getItem('accountType') || '').toLowerCase();

  // pick the right menu for this user
  let Side = (
    <SideMenu
      isOpen={sideMenuOpen}
      toggleMenu={() => setSideMenuOpen(false)}
    />
  );
  if (token) {
    if (accountType === 'business') {
      Side = (
        <SideMenuBusiness
          isOpen={sideMenuOpen}
          toggleMenu={() => setSideMenuOpen(false)}
          closeMenu={() => setSideMenuOpen(false)}
        />
      );
    } else if (accountType === 'affiliate') {
      Side = (
        <SideMenuAffiliate
          isOpen={sideMenuOpen}
          toggleMenu={() => setSideMenuOpen(false)}
          closeMenu={() => setSideMenuOpen(false)}
        />
      );
    } else {
      Side = (
        <SideMenuCustomer
          isOpen={sideMenuOpen}
          toggleMenu={() => setSideMenuOpen(false)}
          closeMenu={() => setSideMenuOpen(false)}
        />
      );
    }
  }

  // favorites data
  const [favorites, setFavorites] = useState([]);
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
  const baseUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    async function fetchFavs() {
      try {
        const { data } = await axios.get(`${baseUrl}/favorites`, axiosConfig);
        setFavorites(data);
      } catch (err) {
        console.error('Failed to load favorites', err);
      }
    }
    if (token) fetchFavs();
  }, [token, baseUrl]);

  const remove = async (id) => {
    try {
      await axios.delete(`${baseUrl}/favorites/${id}`, axiosConfig);
      setFavorites(favorites.filter(f => f._id !== id));
    } catch (err) {
      console.error('Failed to remove favorite', err);
    }
  };

  return (
    <div className={styles.container} style={{ paddingTop: '56px' }}>
      {/* fixed header with menu toggle */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          Hyre
        </div>
        <button
          className={styles.menuIcon}
          onClick={() => setSideMenuOpen(o => !o)}
        >
          ☰
        </button>
      </header>

      {/* slide-out side menu */}
      {Side}

      {/* page content */}
      <div style={{ margin: '1rem' }}>
        <h2>Your Favorites</h2>
        {favorites.length === 0 ? (
          <p>You have no favorites yet.</p>
        ) : (
          <div className={styles.listingsGrid}>
            {favorites.map(f => (
              <div
                key={f._id}
                className={styles.listingCard}
                onClick={() => navigate(`/details/listing/${f._id}`)}
                style={{ position: 'relative' }}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={
                      f.images?.[0]
                        ? `${process.env.REACT_APP_BACKEND_URL.replace(/\/api$/, '')}/${f.images[0]}`
                        : '/placeholder.jpg'
                    }
                    alt={f.title || `${f.make} ${f.model}`}
                    className={styles.cardImage}
                  />
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.carTitle}>
                    {f.make} {f.model}
                  </h3>
                  <p className={styles.carLocation}>
                    {f.location || f.address}
                  </p>
                  <p className={styles.price}>
                    £{parseFloat(f.pricePerDay).toFixed(2)}/day
                  </p>
                </div>
                <button
                  className={styles.favoriteBtn}
                  onClick={e => {
                    e.stopPropagation();
                    remove(f._id);
                  }}
                  aria-label="Remove favorite"
                >
                  ❤️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
