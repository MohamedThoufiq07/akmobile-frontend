import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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

  const isTestEnv = import.meta.env.MODE === 'test';

  const items = toasts.map((t) => (
    <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
  ));

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
      className="pointer-events-none flex flex-col items-center gap-2.5 w-full max-w-[calc(100vw-24px)] sm:max-w-[480px]"
      aria-live="polite"
      aria-atomic="false"
      data-testid="top-center-notification-container"
    >
      {isTestEnv ? items : <AnimatePresence mode="sync">{items}</AnimatePresence>}
    </div>,
    document.body
  );
};

export const ToastContainer = CenteredToastContainer;
export const TopCenterToastContainer = CenteredToastContainer;

const ToastItem = ({ toast, onDismiss }) => {
  const {
    type = 'info',
    title,
    message,
    duration = type === 'error' ? 7000 : (type === 'warning' ? 5000 : (type === 'info' ? 4000 : 3000)),
  } = toast;

  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const remainingRef = useRef(duration);
  const startTimeRef = useRef(0);
  const isMountedRef = useRef(true);
  const shouldReduceMotion = useReducedMotion();

  const IconComponent = ICONS[type] || FiInfo;
  const style = STYLES[type] || STYLES.info;
  const isAssertive = type === 'error';

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (duration === Infinity || duration <= 0) return;

    if (!isPaused) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onDismiss();
        }
      }, remainingRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, duration, onDismiss]);

  const handlePause = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - startTimeRef.current;
      remainingRef.current = Math.max(500, remainingRef.current - elapsed);
    }
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const isTestEnv = import.meta.env.MODE === 'test';

  const animProps = isTestEnv
    ? {
        initial: false,
        animate: { opacity: 1 },
        transition: { duration: 0 },
      }
    : shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, y: -16, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -12, scale: 0.96 },
        transition: { type: 'spring', stiffness: 420, damping: 28 },
      };



  return (
    <motion.div
      layout
      {...animProps}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      data-testid={`toast-${type}`}
      data-type={type}
      className={`pointer-events-auto w-full max-w-[calc(100vw-24px)] sm:max-w-[480px] bg-slate-900/95 text-white backdrop-blur-xl border ${style.accentBorder} shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 select-none`}
    >
      <div className={`p-2 rounded-xl shrink-0 ${style.badgeBg}`}>
        <IconComponent size={20} className={style.iconColor} aria-hidden="true" />
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
        type="button"
        onClick={onDismiss}
        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        aria-label="Dismiss notification"
      >
        <FiX size={16} aria-hidden="true" />
      </button>
    </motion.div>
  );
};
