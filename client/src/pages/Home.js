// client/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { FaSearch, FaHeart, FaRegHeart } from 'react-icons/fa'; // ← heart icons
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useJsApiLoader } from '@react-google-maps/api';
import axios from 'axios'; // ← axios for favorites

import SideMenu from '../components/SideMenu';
import SideMenuCustomer from '../components/SideMenuCustomer';
import SideMenuBusiness from '../components/SideMenuBusiness';
import SideMenuAffiliate from '../components/SideMenuAffiliate';

import PlaceAutocomplete from '../components/PlaceAutocomplete';
import Footer from '../components/Footer';

import styles from '../styles/Home.module.css';
import heroImage from '../assets/hero.jpg';

// We'll geocode the location on the Home page to pass lat & lng in the URL:
async function geocodeAddress(address) {
  if (!window.google) return null;
  const geocoder = new window.google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        resolve({ lat, lng });
      } else {
        reject(status);
      }
    });
  });
}

const libraries = ['places'];

/**
 * Helper to format the current local time in yyyy-mm-ddThh:mm
 * so that it can be used as a default value for <input type="datetime-local" />
 */
function getLocalDateTimeString(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/**
 * Remove any trailing slash so we never fetch HTML by accident
 */
function sanitizeBaseUrl(url) {
  return url?.replace(/\/+$/, '') || '';
}

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load Google Maps for geocoding + autocomplete
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  // Compute default "From" = Now, and "Until" = 2 days from now
  const now = new Date();
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const [location, setLocation] = useState('');
  const [fromDateTime, setFromDateTime] = useState(getLocalDateTimeString(now));
  const [toDateTime, setToDateTime] = useState(getLocalDateTimeString(twoDaysLater));
  const [menuOpen, setMenuOpen] = useState(false);

  // NEW: featured cars + favorites state
  const [featuredCars, setFeaturedCars] = useState([]);
  const [favoritesSet, setFavoritesSet] = useState(new Set());

  // side menu login status
  const token = (localStorage.getItem('token') || '').trim();
  const accountType = (localStorage.getItem('accountType') || '').toLowerCase();
  const isCustomerLoggedIn = token !== '' && accountType === 'customer';
  const isBusinessLoggedIn = token !== '' && accountType === 'business';
  const isAffiliateLoggedIn = token !== '' && accountType === 'affiliate';

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // axios config & base URL
  const BACKEND = sanitizeBaseUrl(process.env.REACT_APP_BACKEND_URL);
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch & filter two Birmingham listings on mount
  useEffect(() => {
    fetch(`${BACKEND}/listings`)
      .then(res => {
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        const birmingham = data.filter(
          listing => listing.address && listing.address.includes('Birmingham')
        );
        setFeaturedCars(birmingham.slice(0, 2));
      })
      .catch(err => console.error('Error fetching featured cars:', err));
  }, []);

  // load customer’s current favorites on mount
  useEffect(() => {
    if (!isCustomerLoggedIn) return;
    axios.get(`${BACKEND}/favorites`, axiosConfig)
      .then(({ data }) => setFavoritesSet(new Set(data.map(f => f._id))))
      .catch(err => console.error('Failed to load favorites', err));
  }, [isCustomerLoggedIn]);

  // Callback from PlaceAutocomplete
  const handlePlaceSelect = (prediction) => {
    setLocation(prediction.description);
  };

  // On user pressing "Search"
  const handleSearch = async () => {
    let lat = '', lng = '';
    if (location && isLoaded && window.google) {
      try {
        const coords = await geocodeAddress(location);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      } catch (err) {
        console.error('Geocode error on Home page:', err);
      }
    }
    navigate(
      `/search?location=${encodeURIComponent(location)}` +
      `&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}` +
      `&from=${encodeURIComponent(fromDateTime)}` +
      `&to=${encodeURIComponent(toDateTime)}`
    );
  };

  const handleListYourCar = () => {
    if (isBusinessLoggedIn) {
      navigate('/add-listing');
    } else if (token) {
      alert('You must be logged in as a business to list your car.');
    } else {
      alert('Please log in to list your car.');
      navigate('/login');
    }
  };

  // Determine which side menu to render
  let sideMenuComponent = <SideMenu isOpen={menuOpen} toggleMenu={toggleMenu} />;
  if (isBusinessLoggedIn) {
    sideMenuComponent = (
      <SideMenuBusiness isOpen={menuOpen} toggleMenu={toggleMenu} closeMenu={closeMenu} />
    );
  } else if (isCustomerLoggedIn) {
    sideMenuComponent = (
      <SideMenuCustomer isOpen={menuOpen} toggleMenu={toggleMenu} closeMenu={closeMenu} />
    );
  } else if (isAffiliateLoggedIn) {
    sideMenuComponent = (
      <SideMenuAffiliate isOpen={menuOpen} toggleMenu={toggleMenu} closeMenu={closeMenu} />
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>Hyre</div>
        <button className={styles.menuIcon} onClick={toggleMenu}>
          ☰
        </button>
      </header>

      {sideMenuComponent}

      {/* Hero */}
      <section className={styles.hero} style={{ backgroundImage: `url(${heroImage})` }}>
        <div className={styles.heroOverlay} />
        <div className={styles.searchContainer}>
          {/* Where field */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{t('Where')}</label>
            <PlaceAutocomplete
              value={location}
              onChange={e => setLocation(e.target.value)}
              onPlaceSelect={handlePlaceSelect}
              placeholder={t('Enter a location...')}
            />
          </div>
          {/* From field */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{t('From')}</label>
            <input
              type="datetime-local"
              className={styles.searchInput}
              value={fromDateTime}
              onChange={e => setFromDateTime(e.target.value)}
            />
          </div>
          {/* Until field */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{t('Until')}</label>
            <input
              type="datetime-local"
              className={styles.searchInput}
              value={toDateTime}
              onChange={e => setToDateTime(e.target.value)}
            />
          </div>
          {/* Search button */}
          <button
            className={styles.searchIconButton}
            onClick={handleSearch}
            aria-label="Search"
          >
            <FaSearch />
          </button>
        </div>
      </section>

      {/* Featured Cars */}
      <section className={styles.featuredSection}>
        <h2 className={styles.featuredTitle}>{t('Featured Cars')}</h2>
        {featuredCars.length === 0 ? (
          <p>{t('No featured cars available.')}</p>
        ) : (
          <div className={styles.listingsGrid}>
            {featuredCars.map(car => {
              const isFav = favoritesSet.has(car._id);

              return (
                <div
                  key={car._id}
                  className={styles.listingCard}                
                  onClick={() => navigate(`/details/listing/${car._id}`)}
                >
                  {/* always show heart */}
                  <button
                    className={styles.favoriteBtn}
                    onClick={async e => {
                      e.stopPropagation();
                      if (!isCustomerLoggedIn) {
                        alert('Please log in to add this car to your favorites');
                        navigate('/login');
                        return;
                      }
                      // toggle favorite
                      try {
                        if (isFav) {
                          await axios.delete(`${BACKEND}/favorites/${car._id}`, axiosConfig);
                          favoritesSet.delete(car._id);
                        } else {
                          await axios.post(`${BACKEND}/favorites/${car._id}`, {}, axiosConfig);
                          favoritesSet.add(car._id);
                        }
                        // trigger re-render
                        setFavoritesSet(new Set(favoritesSet));
                      } catch (err) {
                        console.error('Favorite toggle failed', err);
                      }
                    }}
                    aria-label={isFav ? t('Remove from favorites') : t('Add to favorites')}
                  >
                    {/* outline if not favorited OR not logged in; solid if favorited */}
                    {isFav && isCustomerLoggedIn ? <FaHeart /> : <FaRegHeart />}
                  </button>

                  <div className={styles.imageWrapper}>
                    <img
                      src={`${sanitizeBaseUrl(process.env.REACT_APP_BACKEND_URL)}/${car.images[0]}`}
                      alt={car.title}
                      className={styles.cardImage}
                    />
                  </div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.carTitle}>{car.title}</h3>
                    <p className={styles.carLocation}>{car.address}</p>
                    <p className={styles.price}>
                      £{parseFloat(car.pricePerDay).toFixed(2)}/day
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {/* Promo Section */}
      <section className={styles.promoSection}>
        <div className={styles.promoItem}>
          <div className={styles.promoIcon}>🎉</div>
          <h3>{t('Enjoy Great Freebies')}</h3>
          <p>{t('Get free services, maintenance checks, and more for your car.')}</p>
          <a href="/signup" className={styles.promoLink}>{t('Sign up now')} &gt;</a>
        </div>
        <div className={styles.promoItem}>
          <div className={styles.promoIcon}>🚀</div>
          <h3>{t('Sign Up Now')}</h3>
          <p>{t('Accelerate your membership and get the best deals instantly!')}</p>
          <a href="/signup" className={styles.promoLink}>{t('Sign up now')} &gt;</a>
        </div>
        <div className={styles.promoItem}>
          <div className={styles.promoIcon}>💙</div>
          <h3>{t('Trusted Providers')}</h3>
          <p>{t('Access a network of reliable local car rental businesses.')}</p>
          <a href="/signup" className={styles.promoLink}>{t('Learn more')} &gt;</a>
        </div>
        <div className={styles.promoItem}>
          <div className={styles.promoIcon}>⚡</div>
          <h3>{t('Fast and Easy')}</h3>
          <p>{t('Book in minutes with our seamless reservation process.')}</p>
          <a href="/signup" className={styles.promoLink}>{t('Learn more')} &gt;</a>
        </div>
      </section>

      {/* List Your Car */}
      <section className={styles.listYourCarSection}>
        <h2>{t('List Your Car')}</h2>
        <p className={styles.listYourCarContent}>
          {t("Earn extra income by listing your car on Hyre. Set your own rates and availability, and we'll connect you with local customers looking for the perfect ride.")}
        </p>
        <button className={styles.listYourCarButton} onClick={handleListYourCar}>
          {t('List Your Car')}
        </button>
      </section>

      <Footer/>
    </div>
  );
}
