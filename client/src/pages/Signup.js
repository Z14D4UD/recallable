import React, { useState } from 'react';
import axios               from 'axios';
import { jwtDecode }       from 'jwt-decode';
import { useNavigate }     from 'react-router-dom';
import { useTranslation }  from 'react-i18next';
import styles              from '../styles/Signup.module.css';

export default function Signup() {
  const { t }    = useTranslation();
  const navigate = useNavigate();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [role,        setRole]        = useState('customer');   // default

  // NEW: track whether they've accepted the terms
  const [acceptTerms, setAcceptTerms] = useState(false);

  // NEW: state for date of birth & to toggle input type
  const [dateOfBirth,  setDateOfBirth]  = useState('');
  const [dobInputType, setDobInputType] = useState('text');

  // NEW: state for the 5% fee acknowledgement (business only)
  const [ackFee,       setAckFee]       = useState(false);

  const goHome = () => navigate('/');

  const handleSignup = async (e) => {
    e.preventDefault();

    // NEW: enforce terms acceptance
    if (!acceptTerms) {
      return alert('Please accept the terms and policies');
    }

    // existing guards
    if (role === 'business' && !ackFee) {
      return alert('You must acknowledge Hyre’s 5% success fee to sign up as a business.');
    }
    if (role === 'customer' && !dateOfBirth) {
      return alert('Please provide your date of birth.');
    }

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/signup`,
        {
          name,
          email,
          password,
          accountType: role,
          dateOfBirth,     // sent when customer
          acceptTerms,     // always sent
        }
      );

      /* save tokens & redirect */
      localStorage.setItem('token',       data.token);
      localStorage.setItem('accountType', role);

      try {
        const id  = jwtDecode(data.token).id;
        const key = role === 'business' ? 'businessId' : 'userId';
        if (id) localStorage.setItem(key, id);
      } catch { /* ignore */ }

      if (role === 'business')      navigate('/dashboard/business');
      else if (role === 'affiliate') navigate('/dashboard/affiliate');
      else                           navigate('/account');
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.msg || 'Signup failed');
    }
  };

  return (
    <div className={styles.container}>
      {/* Left panel */}
      <div className={styles.leftPanel}>
        <div className={styles.desktopWave}/>
        <div className={styles.brandContainer} onClick={goHome}>
          <div className={styles.brandTitle}>Hyre</div>
          <div className={styles.brandSubtext}>Let your journey begin...</div>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Sign Up</h2>
          <p  className={styles.formSubtitle}>Create your account to continue</p>

          <form className={styles.form} onSubmit={handleSignup}>
            <input
              className={styles.inputField}
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              className={styles.inputField}
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            {/* mobile-friendly DOB */}
            <input
              className={styles.inputField}
              type={dobInputType}
              placeholder="dd/mm/yyyy"
              value={dateOfBirth}
              onFocus={() => setDobInputType('date')}
              onBlur={() => !dateOfBirth && setDobInputType('text')}
              onChange={e => setDateOfBirth(e.target.value)}
              required={role === 'customer'}
            />

            <input
              className={styles.inputField}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <select
              className={styles.inputField}
              value={role}
              onChange={e => setRole(e.target.value)}
              required
            >
              <option value="business">{t('Sign up as a Business')}</option>
              <option value="customer">{t('Sign up as a Customer')}</option>
              <option value="affiliate">{t('Sign up as an Affiliate')}</option>
            </select>

            {/* NEW: Accept terms (always shown) */}
            <div className={styles.checkboxContainer}>
              <input
                id="acceptTerms"
                type="checkbox"
                className={styles.checkbox}
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
              />
              <label htmlFor="acceptTerms" className={styles.checkboxLabel}>
                I accept the terms and policy
              </label>
            </div>

            {/* NEW: only for business */}
            {role === 'business' && (
              <div className={styles.checkboxContainer}>
                <input
                  id="ackFee"
                  type="checkbox"
                  className={styles.checkbox}
                  checked={ackFee}
                  onChange={e => setAckFee(e.target.checked)}
                />
                <label htmlFor="ackFee" className={styles.checkboxLabel}>
                  I acknowledge and agree that Hyre charges a 5% success fee from each completed booking.
                </label>
              </div>
            )}

            <button className={styles.signupButton} type="submit">
              Sign Up
            </button>
          </form>

          <div className={styles.extraRow}>
            Already have an account?
            <a className={styles.extraLink} href="/login">Log In</a>
          </div>
        </div>
      </div>
    </div>
  );
}
