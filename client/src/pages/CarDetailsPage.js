import React, { useEffect, useState, useCallback } from 'react';
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
  useLocation
} from 'react-router-dom';
import api from '../api';

import SideMenu           from '../components/SideMenu';
import SideMenuCustomer   from '../components/SideMenuCustomer';
import SideMenuBusiness   from '../components/SideMenuBusiness';
import SideMenuAffiliate  from '../components/SideMenuAffiliate';

import DatePicker     from 'react-datepicker';
import GoogleMapReact from 'google-map-react';
import 'react-datepicker/dist/react-datepicker.css';
import cls from '../styles/CarDetailsPage.module.css';

const Marker = () => <div style={{ color: '#c00', fontWeight: 700 }}>⬤</div>;
const daysBetween = (a, b) => Math.max(1, Math.ceil((b - a) / 86400000));

export default function CarDetailsPage() {
  const { id }   = useParams();
  const [qs]     = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Side menu ─────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const token  = localStorage.getItem('token') || '';
  const acct   = (localStorage.getItem('accountType') || '').toLowerCase();
  const toggle = () => setMenuOpen(o => !o);
  const close  = () => setMenuOpen(false);

  let sideMenu = <SideMenu isOpen={menuOpen} toggleMenu={toggle} />;
  if (token && acct === 'customer') {
    sideMenu = <SideMenuCustomer isOpen={menuOpen} toggleMenu={toggle} closeMenu={close} />;
  }
  if (token && acct === 'business') {
    sideMenu = <SideMenuBusiness isOpen={menuOpen} toggleMenu={toggle} closeMenu={close} />;
  }
  if (token && acct === 'affiliate') {
    sideMenu = <SideMenuAffiliate isOpen={menuOpen} toggleMenu={toggle} closeMenu={close} />;
  }

  // ── Listing + gallery ──────────────────────────────────────────
  const [item, setItem]               = useState(null);
  const [picsIdx, setPicsIdx]         = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // ── Reviews state ──────────────────────────────────────────────
  const [reviews, setReviews]                   = useState([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  // ── Booking form ───────────────────────────────────────────────
  const today  = new Date();
  const fromQ  = qs.get('from') ? new Date(qs.get('from')) : today;
  const toQ    = qs.get('to')   ? new Date(qs.get('to'))   : new Date(today.getTime() + 2 * 86400000);
  const [name, setName]               = useState('');
  const [startDate, setStartDate]     = useState(fromQ);
  const [startTime, setStartTime]     = useState('10:00');
  const [endDate, setEndDate]         = useState(toQ);
  const [endTime, setEndTime]         = useState('10:00');
  const [confirmManual, setConfirm]   = useState(false);
  const [error, setError]             = useState('');

  // ── Fetch listing ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/listings/${id}`);
        setItem(data);
      } catch (e) {
        console.error('Details fetch error:', e);
        alert(
          e.response?.status === 404 ? 'Listing not found.' : 'Failed to load listing.'
        );
        navigate('/');
      }
    })();
  }, [id, navigate]);

  // ── Fetch reviews for this listing/business ────────────────────
  useEffect(() => {
    if (!item) return;
    (async () => {
      try {
        const businessId = item.business._id;
        const res = await api.get(`/reviews/listing/${businessId}`);
        setReviews(res.data);
      } catch (e) {
        console.error('Reviews fetch error:', e);
      }
    })();
  }, [item]);

  // ── Close gallery & modal on Esc ──────────────────────────────
  const escHandler = useCallback(e => {
    if (e.key === 'Escape') {
      setGalleryOpen(false);
      setShowReviewsModal(false);
    }
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', escHandler);
    return () => window.removeEventListener('keydown', escHandler);
  }, [escHandler]);

  // ── Handle booking ─────────────────────────────────────────────
  const handleBooking = e => {
    e.preventDefault();
    setError('');

    if (item.transmission.toLowerCase() === 'manual' && !confirmManual) {
      return setError('Please confirm you can drive a manual vehicle.');
    }
    if (!token) {
      alert('Please log in to book.');
      return navigate('/login', {
        state: { from: location.pathname + location.search }
      });
    }

    const s  = new Date(`${startDate.toISOString().slice(0,10)}T${startTime}`);
    const eD = new Date(`${endDate.toISOString().slice(0,10)}T${endTime}`);

    const params = new URLSearchParams({
      listingId: id,
      from:      s.toISOString(),
      to:        eD.toISOString()
    }).toString();
    navigate(`/payment?${params}`);
  };

  // ── Loading spinner ────────────────────────────────────────────
  if (!item) {
    return (
      <>
        <header className={cls.header} style={{ borderBottom:'1px solid #eee' }}>
          <div className={cls.logo} style={{ color:'#38b6ff' }} onClick={()=>navigate('/')}>
            Hyre
          </div>
        </header>
        <p className={cls.loading}>Loading…</p>
      </>
    );
  }

  // ── Derived values ─────────────────────────────────────────────
  const ROOT     = process.env.REACT_APP_BACKEND_URL.replace(/\/api$/,'');
  const pictures = item.images?.length ? item.images : [item.imageUrl].filter(Boolean);
  const leadImg  = pictures[picsIdx];
  const lat      = item.latitude  ?? item.location?.lat;
  const lng      = item.longitude ?? item.location?.lng;
  const days     = daysBetween(startDate, endDate);
  const subtotal = (days * parseFloat(item.pricePerDay || 0)).toFixed(0);

  const count = reviews.length;
  const avg   = count > 0
    ? (reviews.reduce((sum,r)=>sum+(r.rating||0),0)/count).toFixed(2)
    : '0.00';

  const distribution = [5,4,3,2,1].map(star => reviews.filter(r=>r.rating===star).length);

  return (
    <>
      <header className={cls.header} style={{ borderBottom:'1px solid #eee' }}>
        <div className={cls.logo} style={{ color:'#38b6ff' }} onClick={()=>navigate('/')}>Hyre</div>
        <button className={cls.menuIcon} style={{borderRadius:'8px',padding:'4px'}} onClick={toggle}>
          ☰
        </button>
      </header>
      {sideMenu}

      {/* gallery modal */}
      {galleryOpen && (
        <div className={cls.modalBackdrop} onClick={()=>setGalleryOpen(false)}>
          <div className={cls.modalContent} onClick={e=>e.stopPropagation()} style={{borderRadius:12}}>
            <div className={cls.modalTop}>
              <h3>{item.make} {item.model} • {avg}⭐</h3>
              <button className={cls.closeBtn} onClick={()=>setGalleryOpen(false)} style={{borderRadius:8}}>
                ✕
              </button>
            </div>
            <img src={`${ROOT}/${leadImg}`} alt="full" />
            <div className={cls.modalThumbs}>
              {pictures.map((p,i)=>(
                <img
                  key={i}
                  src={`${ROOT}/${p}`}
                  className={i===picsIdx?cls.modalActive:''}
                  onClick={()=>setPicsIdx(i)}
                  style={{borderRadius:8}}
                  alt="thumb"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* reviews modal */}
      {showReviewsModal && (
        <div className={cls.modalBackdrop} onClick={()=>setShowReviewsModal(false)}>
          <div className={cls.modalContent} onClick={e=>e.stopPropagation()} style={{borderRadius:12, maxWidth:640}}>
            <div className={cls.modalTop}>
              <h2>Reviews • {avg}⭐ ({count})</h2>
              <button className={cls.closeBtn} onClick={()=>setShowReviewsModal(false)} style={{borderRadius:8}}>
                ✕
              </button>
            </div>
            <div className={cls.reviewsModal}>
              <div className={cls.leftColumn}>
                <div className={cls.bigAvg}>{avg}⭐</div>
                {distribution.map((num,i)=>(
                  <div key={i} className={cls.distRow}>
                    <span>{5-i}★</span>
                    <div className={cls.bar}><div style={{width:`${count?num/count*100:0}%`}}/></div>
                    <span>{num}</span>
                  </div>
                ))}
              </div>
              <div className={cls.rightColumn}>
                <div className={cls.reviewList}>
                  {reviews.map(r=>(
                    <div key={r._id} className={cls.reviewRow}>
                      <strong>{'★'.repeat(r.rating)}</strong>
                      <small>{r.client.name} • {new Date(r.createdAt).toLocaleDateString('en-GB')}</small>
                      <p>{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={cls.page}>
        <section className={cls.gallery}>
          <div className={cls.mainImage} onClick={()=>setGalleryOpen(true)} style={{borderRadius:12}}>
            <img src={`${ROOT}/${leadImg}`} alt="vehicle" style={{borderRadius:12}}/>
          </div>
          <div className={cls.sideImages}>
            {pictures.slice(0,4).map((p,i)=>(
              <img
                key={i}
                src={`${ROOT}/${p}`}
                className={i===picsIdx?cls.activeThumb:''}
                onClick={()=>setPicsIdx(i)}
                style={{borderRadius:8}}
                alt="thumb"
              />
            ))}
          </div>
        </section>

        <section className={cls.content}>
          <div className={cls.details}>
            <h1>
              {item.make} {item.model}
              {item.year && ` · ${item.year}`}
            </h1>
            <div className={cls.meta}>
              <span
                className={cls.rating}
                onClick={()=>setShowReviewsModal(true)}
                style={{cursor:'pointer'}}
              >
                {avg}⭐
              </span>
              <span
                className={cls.clickable}
                onClick={()=>setShowReviewsModal(true)}
              >
                {count} trip{count!==1?'s':''}
              </span>
            </div>

            {/* — Address */}
            <div className={cls.section}>
              <h2>Address</h2>
              <p>{item.address}</p>
            </div>

            {/* — Hosted By */}
            <Link
              to={`/business/${item.business._id}`}
              className={cls.hostedBy}
              style={{ textDecoration:'none', color:'inherit' }}
            >
              {item.business.avatarUrl
                ? <img src={`${ROOT}/${item.business.avatarUrl}`} alt="host" style={{borderRadius:'50%'}}/>
                : <div className={cls.placeholderAvatar}>{item.business.name[0]}</div>
              }
              <div>
                <strong>{item.business.name}</strong><br/>
                Joined{' '}
                {new Date(item.business.createdAt).toLocaleDateString('en-GB',{
                  month:'short', year:'numeric'
                })}
              </div>
            </Link>

            {/* — Features */}
            <div className={cls.section}>
              <h2>Features</h2>
              <ul className={cls.featureList}>
                {[
                  'gps','bluetooth','heatedSeats','parkingSensors','backupCamera',
                  'appleCarPlay','androidAuto','keylessEntry','childSeat','leatherSeats',
                  'tintedWindows','convertible','roofRack','petFriendly',
                  'smokeFree','seatCovers','dashCam'
                ].filter(f=>item[f]).map(f=>(
                  <li key={f}>{f.replace(/([A-Z])/g,' $1')}</li>
                ))}
              </ul>
            </div>

            {/* — Description */}
            {item.description && (
              <div className={cls.section}>
                <h2>Description</h2>
                <p style={{whiteSpace:'pre-line'}}>{item.description}</p>
              </div>
            )}

            {/* — Terms & Conditions */}
            <div className={cls.section}>
              <h2>Terms & Conditions</h2>
              <p style={{whiteSpace:'pre-line'}}>{item.terms}</p>
            </div>

            {/* — Cancellation Policy */}
            <div className={cls.section}>
              <h2>Cancellation Policy</h2>
              <p style={{whiteSpace:'pre-line'}}>{item.cancellationPolicy}</p>
            </div>

            {/* — Pickup location */}
            {lat!=null && lng!=null && (
              <div className={cls.section}>
                <h2>Pickup location</h2>
                <div style={{height:280,borderRadius:12,overflow:'hidden'}}>   
                  <GoogleMapReact
                    bootstrapURLKeys={{key:process.env.REACT_APP_GOOGLE_MAPS_API_KEY}}
                    defaultCenter={{lat,lng}}
                    defaultZoom={12}
                  >
                    <Marker lat={lat} lng={lng}/>
                  </GoogleMapReact>
                </div>
              </div>
            )}
          </div>

          <aside className={cls.sidebar} style={{borderRadius:12}}>
            <form onSubmit={handleBooking} className={cls.priceBox}>
              <div className={cls.priceRow}>
                <span className={cls.price}>£{parseFloat(item.pricePerDay).toFixed(0)}</span>
                <span className={cls.priceUnit}>/ day</span>
              </div>
              <div className={cls.subTotal}>£{subtotal} excl. taxes & fees</div>
              <hr/>

              <h3>Your trip</h3>
              <label>Name</label>
              <input
                required
                className={cls.textInput}
                placeholder="Your name"
                value={name}
                onChange={e=>setName(e.target.value)}
                style={{borderRadius:8}}
              />

              <label>Trip start</label>
              <div className={cls.row}>
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  minDate={today}
                  dateFormat="dd/MM/yyyy"
                  className={cls.dateInput}
                  style={{borderRadius:8}}
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={e=>setStartTime(e.target.value)}
                  className={cls.timeInput}
                  style={{borderRadius:8}}
                />
              </div>

              <label>Trip end</label>
              <div className={cls.row}>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  minDate={startDate}
                  dateFormat="dd/MM/yyyy"
                  className={cls.dateInput}
                  style={{borderRadius:8}}
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={e=>setEndTime(e.target.value)}
                  className={cls.timeInput}
                  style={{borderRadius:8}}
                />
              </div>

              {item.transmission.toLowerCase()==='manual' && (
                <label className={cls.manualCheck}>
                  <input
                    type="checkbox"
                    checked={confirmManual}
                    onChange={e=>setConfirm(e.target.checked)}
                  /> I can drive a manual vehicle
                </label>
              )}

              {error && <p className={cls.error}>{error}</p>}

              <button
                type="submit"
                className={cls.bookBtn}
                style={{
                  borderRadius:24,
                  backgroundColor:'#38b6ff',
                  boxShadow:'0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                Continue
              </button>
            </form>
          </aside>
        </section>
      </div>
    </>
  );
}
