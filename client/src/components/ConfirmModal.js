// client/src/components/ConfirmModal.js
import React from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="cm-overlay">
      <div className="cm-modal">
        <h2>{title}</h2>
        {message && <p>{message}</p>}
        <div className="cm-buttons">
          <button className="cm-yes" onClick={onConfirm}>Yes</button>
          <button className="cm-no"  onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
}
