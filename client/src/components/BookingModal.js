// src/components/BookingModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import BookingDetailPage from '../pages/BookingDetailPage';
import styles from '../styles/BookingModal.module.css';

export default function BookingModal({ isOpen, onClose, bookingId }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
        >
          ×
        </button>

        {/* 
          Render the BookingDetailPage in “modal” mode.
          Pass bookingId explicitly so it doesn’t try to grab useParams().
        */}
        <BookingDetailPage
          bookingId={bookingId}
          isModal={true}
        />
      </div>
    </div>,
    document.body
  );
}
