import React from 'react';
import Modal from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
}

const ConfirmDialog: React.FC<Props> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', loading = false, variant = 'danger',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={`btn btn-${variant}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <span className="spinner-sm spinner" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
