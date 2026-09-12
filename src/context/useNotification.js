import { useContext } from 'react';
import { NotificationContext } from './notificationContexts';

const fallbackNotify = {
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  dismiss: () => {},
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  return context || fallbackNotify;
};

export default useNotification;
