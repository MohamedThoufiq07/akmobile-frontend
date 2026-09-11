import { useContext } from 'react';
import { ConfirmContext } from './notificationContexts';

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a GlobalNotificationProvider');
  }
  return context;
};

export default useConfirm;
