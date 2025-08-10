// client/src/pages/CustomerAccountPage.js

import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SideMenuCustomer from '../components/SideMenuCustomer';
import Webcam from 'react-webcam';
import styles from '../styles/CustomerAccountPage.module.css';

export default function AccountPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const accountType = localStorage.getItem('accountType');
  const isCustomer = token && accountType === 'customer';

  // Side menu toggling
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);

  // Local user data and transmission
  const [user, setUser] = useState(null);
  const [transmission, setTransmission] = useState('');

  // ID verification state
  const [licenseFile, setLicenseFile] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [step, setStep] = useState('idle'); // idle | capturing | verifying
  const [result, setResult] = useState(null);
  const webcamRef = useRef(null);

  // Use your backend URL from environment
  const backendUrl =
    process.env.REACT_APP_BACKEND_URL || 'https://hyre-backend.onrender.com/api';

  // Fetch account data
  useEffect(() => {
    if (!isCustomer) {
      alert('Please log in as a customer to view your account.');
      navigate('/');
      return;
    }
    api
      .get('/account')
      .then((res) => {
        setUser(res.data);
        setTransmission(res.data.transmission || '');
      })
      .catch((err) => {
        console.error('Error fetching account:', err);
        alert('Failed to load account data.');
      });
  }, [isCustomer, navigate, backendUrl, token]);

  // Save transmission: if user selects an option, save and update UI
  const handleSaveTransmission = () => {
    axios
      .put(
        `${backendUrl}/account`,
        { transmission },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setUser(res.data);
        setTransmission(res.data.transmission || '');
        alert('Transmission preference saved.');
      })
      .catch((err) => {
        console.error('Error updating transmission:', err);
        alert('Failed to update transmission.');
      });
  };

  // Download account data as PDF
  const handleDownloadData = () => {
    axios
      .get(`${backendUrl}/account/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // ensures binary data is returned
      })
      .then((res) => {
        const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'MyHyreData.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('Error downloading PDF:', err);
        alert('Failed to download data.');
      });
  };

  // Close account
  const handleCloseAccount = () => {
    if (!window.confirm('Are you sure you want to close your account?')) return;
    axios
      .delete(`${backendUrl}/account`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert('Account closed.');
        localStorage.removeItem('token');
        localStorage.removeItem('accountType');
        navigate('/');
      })
      .catch((err) => {
        console.error('Error closing account:', err);
        alert('Failed to close account.');
      });
  };

  // ID upload handler
  const handleLicenseChange = (e) => {
    setLicenseFile(e.target.files[0]);
    setResult(null);
  };

  // Start camera capture
  const startCapture = () => {
    setStep('capturing');
    setResult(null);
  };

  // Take selfie from webcam
  const takeSelfie = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        setSelfieBlob(blob);
        setStep('idle');
      });
  };

  // Send both images to backend for verification
  const handleVerifyId = async () => {
    if (!licenseFile || !selfieBlob) {
      alert('Please upload your license and take a selfie first.');
      return;
    }
    setStep('verifying');
    const form = new FormData();
    form.append('license', licenseFile);
    form.append('selfie', selfieBlob, 'selfie.jpg');

    try {
      const res = await axios.post(`${backendUrl}/verify-id`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult({
        success: true,
        text: `✅ Identity verified (Similarity: ${res.data.similarity}%)`,
      });
    } catch (err) {
      console.error('ID verification error:', err);
      const msg = err.response?.data?.error || '❌ Verification failed.';
      setResult({ success: false, text: msg });
    } finally {
      setStep('idle');
    }
  };

  if (!user) {
    return <div className={styles.container}>Loading account...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/')}>Hyre</div>
        <button className={styles.menuIcon} onClick={toggleMenu}>☰</button>
      </header>

      {/* Side Menu */}
      {isCustomer && (
        <SideMenuCustomer
          isOpen={menuOpen}
          toggleMenu={toggleMenu}
          closeMenu={closeMenu}
        />
      )}

      {/* Main content area */}
      <div className={styles.content}>
        <h1>Account</h1>

        {/* Contact Information */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Information</h2>
          <p>
            Email: <strong>{user.email}</strong>{' '}
            <span style={{ color: 'green' }}>(Verified)</span>
          </p>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => navigate('/change-password')}
          >
            Change Password
          </button>
        </div>

        {/* Transmission Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Transmission</h2>
          <p>
            Some cars on Hyre do not have automatic transmissions. Can you drive a manual car?
          </p>
          {user.transmission && user.transmission !== '' ? (
            <p>
              <strong>Your transmission setting:</strong> {user.transmission}
            </p>
          ) : (
            <>
              <select
                className={styles.selectField}
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
              >
                <option value="">Select your option</option>
                <option value="No, I am not an expert">No, I am not an expert</option>
                <option value="Yes, I can drive manual">Yes, I can drive manual</option>
              </select>
              <div className={styles.buttonRow}>
                <button className={styles.button} onClick={handleSaveTransmission}>
                  Save changes
                </button>
              </div>
            </>
          )}
        </div>

        {/* ID Verification Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>ID Verification</h2>
          <label>
            Upload Driver’s License
            <input
              type="file"
              accept="image/*"
              onChange={handleLicenseChange}
            />
          </label>
          <div style={{ margin: '16px 0' }}>
            {step === 'capturing' ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={320}
                />
                <button className={styles.button} onClick={takeSelfie}>
                  Capture Photo
                </button>
              </>
            ) : (
              <button className={styles.button} onClick={startCapture}>
                {selfieBlob ? 'Retake Selfie' : 'Take Selfie'}
              </button>
            )}
          </div>

          {/* New: confirmation message when selfie is captured */}
          {selfieBlob && step === 'idle' && (
            <p style={{ color: 'green', marginBottom: '12px' }}>
              ✓ Photo captured successfully.
            </p>
          )}

          <button
            className={styles.button}
            onClick={handleVerifyId}
            disabled={step === 'verifying'}
          >
            {step === 'verifying' ? 'Verifying…' : 'Verify ID'}
          </button>
          {result && (
            <p style={{ marginTop: 12, color: result.success ? 'green' : 'red' }}>
              {result.text}
            </p>
          )}
        </div>

        {/* Loyalty Points Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Loyalty Points</h2>
          <p>
            You earn 10 points for each booking. Once you reach 500 points, you can request a reward by emailing us.
          </p>
          <p>Your current points: <strong>{user.points || 0}</strong></p>
          {user.points >= 500 && (
            <p className={styles.loyaltyNote}>
              Congratulations! You have enough points to claim a reward. Please email us to redeem.
            </p>
          )}
        </div>

        {/* Download Data Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Download account data</h2>
          <p>Download a PDF copy of all information we have about your account.</p>
          <button className={styles.button} onClick={handleDownloadData}>
            Download my data
          </button>
        </div>

        {/* Close Account Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Close account</h2>
          <p>Once you close your account, all your data will be deleted permanently.</p>
          <button className={`${styles.button} ${styles.buttonDanger}`} onClick={handleCloseAccount}>
            Close my account
          </button>
        </div>
      </div>
    </div>
  );
}
