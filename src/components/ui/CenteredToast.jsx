import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

const STYLES = {
  success: {
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    accentBorder: 'border-emerald-500/40',
    iconColor: 'text-emerald-400',
  },
  error: {
    badgeBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    accentBorder: 'border-rose-500/40',
    iconColor: 'text-rose-400',
  },
  warning: {
    badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    accentBorder: 'border-amber-500/40',
    iconColor: 'text-amber-400',
  },
  info: {
    badgeBg: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    accentBorder: 'border-sky-500/40',
    iconColor: 'text-sky-400',
  },
};

export const CenteredToastContainer = ({ toasts, removeToast }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none z-[10000] flex flex-col items-center justify-center p-4 gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

const ToastItem = ({ toast, onDismiss }) => {
  const { type = 'info', title, message, duration = type === 'error' ? 6000 : 3500 } = toast;
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const remainingRef = useRef(duration);
  const startTimeRef = useRef(0);

  const IconComponent = ICONS[type] || FiInfo;
  const style = STYLES[type] || STYLES.info;
  const isAssertive = type === 'error';

  useEffect(() => {
    if (duration === Infinity) return;

    const startTimer = () => {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, remainingRef.current);
    };

    if (!isPaused) {
      startTimer();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, duration, onDismiss]);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingRef.current = Math.max(500, remainingRef.current - elapsed);
    }
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: -10 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      className={`pointer-events-auto w-full max-w-md bg-slate-900/95 text-white backdrop-blur-xl border ${style.accentBorder} shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 select-none`}
    >
      <div className={`p-2 rounded-xl shrink-0 ${style.badgeBg}`}>
        <IconComponent size={20} className={style.iconColor} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <h4 className="font-bold text-sm text-slate-100 leading-snug truncate">
            {title}
          </h4>
        )}
        <p className="text-xs text-slate-300 leading-relaxed break-words mt-0.5">
          {message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-1"
        aria-label="Dismiss notification"
      >
        <FiX size={16} />
      </button>
    </motion.div>
  );
};
