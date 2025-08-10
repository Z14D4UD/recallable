// client/src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/Login.module.css';

export default function Login() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  /* -------------------------------------------------- */
  /*  Clicking the Hyre brand sends user home           */
  /* -------------------------------------------------- */
  const goHome = () => navigate('/');

  /* -------------------------------------------------- */
  /*  Login submit                                      */
  /* -------------------------------------------------- */
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/login`,
        { email, password }
      );

      // save token + role
      localStorage.setItem('token',       data.token);
      localStorage.setItem('accountType', data.accountType);

      // also save user/business id
      try {
        const decoded = jwtDecode(data.token);
        const key     = data.accountType === 'business' ? 'businessId' : 'userId';
        if (decoded.id) localStorage.setItem(key, decoded.id);
      } catch { /* ignore */ }

      // decide where to send them
      let dest = data.redirectUrl; // backend may provide one
      if (!dest) {
        switch (data.accountType) {
          case 'admin':     dest = '/dashboard/admin';     break;
          case 'business':  dest = '/dashboard/business';  break;
          case 'customer':  dest = '/';                    break;
          case 'affiliate': dest = '/dashboard/affiliate'; break;
          default:          dest = '/';
        }
      }

      // if they came here via a protected route, go back there
      const from = location.state?.from;
      if (from) dest = from;

      navigate(dest, { replace: true });
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.msg || 'Login failed');
    }
  };

  /* -------------------------------------------------- */
  /*  JSX                                               */
  /* -------------------------------------------------- */
  return (
    <div className={styles.container}>
      {/* Left panel – wave / gradient */}
      <div className={styles.leftPanel}>
        <div className={styles.desktopWave}/>
        <div className={styles.brandContainer} onClick={goHome}>
          <div className={styles.brandTitle}>Hyre</div>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Welcome</h2>
          <p className={styles.formSubtitle}>
            Login to your account to continue
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              className={styles.inputField}
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className={styles.inputField}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <Link className={styles.forgotPassword} to="/change-password">
              Forgot your password?
            </Link>

            <button className={styles.loginButton} type="submit">
              {t('Login')}
            </button>
          </form>

          <div className={styles.signupRow}>
            Don’t have an account?{' '}
            <Link className={styles.signupLink} to="/signup">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
