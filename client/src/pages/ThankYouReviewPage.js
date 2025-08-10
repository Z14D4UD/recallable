import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/ThankYouReviewPage.module.css';

export default function ThankYouReviewPage() {
  return (
    <div className={styles.container}>
      <h1>Thank you for your review! 🎉</h1>
      <p>Your feedback helps others make great decisions.</p>
      <Link to="/" className={styles.button}>
        Back to Home
      </Link>
    </div>
  );
}
