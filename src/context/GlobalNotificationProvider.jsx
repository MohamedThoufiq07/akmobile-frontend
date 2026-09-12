import { useState, useCallback, useRef } from 'react';
import { CenteredToastContainer } from '../components/ui/CenteredToast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { NotificationContext, ConfirmContext } from './notificationContexts';

const formatToastMessage = (message) => {
  if (!message) return 'An unexpected error occurred.';
  if (typeof message === 'string') return message.trim();
  if (typeof message === 'object') {
    if (message.response?.data?.message && typeof message.response.data.message === 'string') {
      return message.response.data.message.trim();
    }
    if (message.response?.data?.error && typeof message.response.data.error === 'string') {
      return message.response.data.error.trim();
    }
    if (message.response?.data?.detail && typeof message.response.data.detail === 'string') {
      return message.response.data.detail.trim();
    }
    if (message.message && typeof message.message === 'string' && !message.message.includes('AxiosError')) {
      return message.message.trim();
    }
  }
  return 'Unable to complete the request. Please try again.';
};

export const GlobalNotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    confirmationKeyword: '',
    loading: false,
    loadingText: 'Processing...',
  });
  const dialogResolver = useRef(null);

  // Toast Management
  const addToast = useCallback(({ type = 'info', title = '', message = '', duration }) => {
    const formattedMessage = formatToastMessage(message);
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts((prev) => {
      // Prevent immediate duplicate active toast with identical type and message
      const isDuplicate = prev.some((t) => t.type === type && t.message === formattedMessage);
      if (isDuplicate) {
        return prev;
      }
      // Cap visible toasts to maximum 3: drop oldest
      const trimmed = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      return [
        ...trimmed,
        { id, type, title: title ? String(title).trim() : '', message: formattedMessage, duration },
      ];
    });

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = {
    success: (message, title) => addToast({ type: 'success', message, title, duration: 3000 }),
    error: (message, title) => addToast({ type: 'error', message, title, duration: 7000 }),
    warning: (message, title) => addToast({ type: 'warning', message, title, duration: 5000 }),
    info: (message, title) => addToast({ type: 'info', message, title, duration: 4000 }),
    dismiss: removeToast,
  };

  // Confirmation Dialog Management
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      dialogResolver.current = resolve;
      setDialogState({
        isOpen: true,
        title: options.title || 'Are you sure?',
        message: options.message || 'This action cannot be undone.',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger',
        confirmationKeyword: options.confirmationKeyword || '',
        loading: false,
        loadingText: options.loadingText || 'Processing...',
      });
    });
  }, []);

  const handleDialogConfirm = useCallback(() => {
    if (dialogResolver.current) {
      dialogResolver.current(true);
      dialogResolver.current = null;
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleDialogCancel = useCallback(() => {
    if (dialogResolver.current) {
      dialogResolver.current(false);
      dialogResolver.current = null;
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <NotificationContext.Provider value={notify}>
      <ConfirmContext.Provider value={{ confirm, setDialogLoading: (loading, loadingText) => setDialogState(prev => ({ ...prev, loading, loadingText: loadingText || prev.loadingText })) }}>
        {children}
        <CenteredToastContainer toasts={toasts} removeToast={removeToast} />
        <ConfirmDialog
          {...dialogState}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
        />
      </ConfirmContext.Provider>
    </NotificationContext.Provider>
  );
};

export default GlobalNotificationProvider;
