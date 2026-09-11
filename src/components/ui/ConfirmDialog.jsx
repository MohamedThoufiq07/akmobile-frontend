import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiCheckCircle } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

const VARIANT_CONFIG = {
  danger: {
    icon: FiAlertTriangle,
    iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    confirmButton: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm shadow-rose-200',
  },
  warning: {
    icon: FiAlertCircle,
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 shadow-sm shadow-amber-200',
  },
  info: {
    icon: FiInfo,
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
    confirmButton: 'bg-brand-blue hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm shadow-blue-200',
  },
  success: {
    icon: FiCheckCircle,
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    confirmButton: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-sm shadow-emerald-200',
  },
};

export const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  confirmationKeyword = '',
  loading = false,
  loadingText = 'Processing...',
  onConfirm,
  onCancel,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const cancelBtnRef = useRef(null);
  const keywordInputRef = useRef(null);
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;
  const IconComponent = config.icon;
  const isKeywordRequired = Boolean(confirmationKeyword && confirmationKeyword.trim().length > 0);
  const isConfirmDisabled = loading || (isKeywordRequired && typedInput.trim() !== confirmationKeyword.trim());

  useEffect(() => {
    if (!isOpen) return;
    previousActiveElement.current = document.activeElement;

    // Focus management: initial focus to cancel or keyword input
    const timer = setTimeout(() => {
      if (isKeywordRequired && keywordInputRef.current) {
        keywordInputRef.current.focus();
      } else if (cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, isKeywordRequired]);

  // Focus trap + Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!loading && onCancel) {
          e.preventDefault();
          onCancel();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="region"
          aria-label="Confirmation Modal"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              if (!loading && onCancel) onCancel();
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Dialog Card */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 overflow-hidden z-10 select-none"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
                <IconComponent size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 leading-snug">
                  {title}
                </h3>
                <p id="confirm-dialog-desc" className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>

            {/* Verification Keyword Input if needed */}
            {isKeywordRequired && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Type <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{confirmationKeyword}</span> to confirm:
                </label>
                <input
                  ref={keywordInputRef}
                  type="text"
                  value={typedInput}
                  disabled={loading}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder={`Type "${confirmationKeyword}"`}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-2">
              <button
                ref={cancelBtnRef}
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {cancelText}
              </button>

              <button
                type="button"
                disabled={isConfirmDisabled}
                onClick={onConfirm}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${config.confirmButton}`}
              >
                {loading && <LoadingSpinner size="sm" color="white" />}
                <span>{loading ? loadingText : confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
