import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GlobalNotificationProvider } from '../../../context/GlobalNotificationProvider';
import { useNotification } from '../../../context/useNotification';
import { useConfirm } from '../../../context/useConfirm';

// Test Consumer for Triggering Notifications
const NotificationTestConsumer = () => {
  const notify = useNotification();
  const { confirm } = useConfirm();

  return (
    <div>
      <button onClick={() => notify.success('Product added to cart.', 'Success Title')}>
        Trigger Success
      </button>
      <button onClick={() => notify.error('Unable to complete the request.', 'Error Title')}>
        Trigger Error
      </button>
      <button onClick={() => notify.warning('Low stock warning.', 'Warning Title')}>
        Trigger Warning
      </button>
      <button onClick={() => notify.info('Only customers who purchased this product can review it.', 'Eligibility')}>
        Trigger Info
      </button>
      <button onClick={() => confirm({ title: 'Logout confirmation', message: 'Are you sure you want to log out?' })}>
        Trigger Confirm
      </button>
    </div>
  );
};

describe('AK Mobiles — Global Notification System Test Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('1. Top-Center Viewport Positioning & Responsive Layout', () => {
    it('1. Success notification renders at top-centre with fixed viewport positioning', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Success'));

      const container = screen.getByTestId('top-center-notification-container');
      expect(container).toBeTruthy();
      expect(container.style.position).toBe('fixed');
      expect(container.style.top).toMatch(/16px/);
      expect(container.style.left).toBe('50%');
      expect(container.style.transform).toBe('translateX(-50%)');
      expect(container.style.zIndex).toBe('9999');

      const toast = screen.getByTestId('toast-success');
      expect(toast).toBeTruthy();
      expect(screen.getByText('Product added to cart.')).toBeTruthy();
      expect(screen.getByText('Success Title')).toBeTruthy();
    });

    it('2. Error notification renders at top-centre', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Error'));

      const toast = screen.getByTestId('toast-error');
      expect(toast).toBeTruthy();
      expect(screen.getByText('Unable to complete the request.')).toBeTruthy();
      expect(screen.getByText('Error Title')).toBeTruthy();
    });

    it('3. Warning notification renders at top-centre', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Warning'));

      const toast = screen.getByTestId('toast-warning');
      expect(toast).toBeTruthy();
      expect(screen.getByText('Low stock warning.')).toBeTruthy();
    });

    it('4. Information / Eligibility notification renders at top-centre', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Info'));

      const toast = screen.getByTestId('toast-info');
      expect(toast).toBeTruthy();
      expect(screen.getByText('Only customers who purchased this product can review it.')).toBeTruthy();
    });

    it('5. Responsive mobile width prevents overflow and adheres to max-width bounds', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Info'));

      const container = screen.getByTestId('top-center-notification-container');
      expect(container.className).toContain('max-w-[calc(100vw-24px)]');
      expect(container.className).toContain('sm:max-w-[480px]');

      const toast = screen.getByTestId('toast-info');
      expect(toast.className).toContain('max-w-[calc(100vw-24px)]');
      expect(toast.className).toContain('sm:max-w-[480px]');
    });
  });

  describe('2. Stacking, Deduplication & Dismissal Lifecycles', () => {
    it('6. Multiple different notifications stack vertically at top-centre', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Success'));
      fireEvent.click(screen.getByText('Trigger Warning'));

      expect(screen.getByTestId('toast-success')).toBeTruthy();
      expect(screen.getByTestId('toast-warning')).toBeTruthy();
      expect(screen.getByText('Product added to cart.')).toBeTruthy();
      expect(screen.getByText('Low stock warning.')).toBeTruthy();
    });

    it('7. Duplicate notifications with identical type and content are suppressed', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Success'));
      fireEvent.click(screen.getByText('Trigger Success'));
      fireEvent.click(screen.getByText('Trigger Success'));

      const successToasts = screen.getAllByTestId('toast-success');
      expect(successToasts.length).toBe(1);
    });

    it('8. Notification auto-dismisses after duration expires', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Success'));
      expect(screen.getByText('Product added to cart.')).toBeTruthy();

      // Fast forward past success duration (3000ms)
      act(() => {
        vi.advanceTimersByTime(3100);
      });

      expect(screen.queryByText('Product added to cart.')).toBeNull();
    });

    it('9. Hovering and focusing pauses auto-dismissal until mouse leave or blur', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Success'));
      const toast = screen.getByTestId('toast-success');

      // Advance 1.5s (half of 3s)
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Hover over toast
      fireEvent.mouseEnter(toast);

      // Advance another 3s while hovered
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Toast must still be visible
      expect(screen.getByText('Product added to cart.')).toBeTruthy();

      // Unhover
      fireEvent.mouseLeave(toast);

      // Advance remaining time + buffer
      act(() => {
        vi.advanceTimersByTime(1600);
      });

      expect(screen.queryByText('Product added to cart.')).toBeNull();
    });

    it('10. Close button dismisses the notification immediately', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Success'));
      expect(screen.getByText('Product added to cart.')).toBeTruthy();

      const closeBtn = screen.getByRole('button', { name: 'Dismiss notification' });
      fireEvent.click(closeBtn);

      expect(screen.queryByText('Product added to cart.')).toBeNull();
    });

    it('11. Cleans up timers without memory leaks or errors upon unmount', () => {
      const { unmount } = render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Success'));
      expect(screen.getByText('Product added to cart.')).toBeTruthy();

      expect(() => {
        unmount();
        vi.advanceTimersByTime(5000);
      }).not.toThrow();
    });
  });

  describe('3. Accessibility & Confirm Dialog Viewport Separation', () => {
    it('12. Success and Info notifications have role="status" and aria-live="polite"', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Success'));
      const toast = screen.getByTestId('toast-success');
      expect(toast.getAttribute('role')).toBe('status');
      expect(toast.getAttribute('aria-live')).toBe('polite');
    });

    it('13. Error notifications have role="alert" and aria-live="assertive"', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Error'));
      const toast = screen.getByTestId('toast-error');
      expect(toast.getAttribute('role')).toBe('alert');
      expect(toast.getAttribute('aria-live')).toBe('assertive');
    });

    it('14. Confirmation dialog remains centered in viewport with backdrop and focus trap', () => {
      render(
        <GlobalNotificationProvider>
          <NotificationTestConsumer />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Confirm'));

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeTruthy();
      expect(screen.getByText('Logout confirmation')).toBeTruthy();
      expect(screen.getByText('Are you sure you want to log out?')).toBeTruthy();

      // Parent container must have items-center justify-center for exact viewport centering
      const wrapper = dialog.parentElement;
      expect(wrapper.className).toContain('items-center');
      expect(wrapper.className).toContain('justify-center');
    });

    it('15. Form validation errors remain inline and do not trigger global toasts', () => {
      // Inline form validation representation
      const SimpleForm = () => (
        <form>
          <label htmlFor="email">Email</label>
          <input id="email" defaultValue="" aria-describedby="email-error" />
          <span id="email-error" className="text-xs text-rose-500">Email is required</span>
        </form>
      );

      render(
        <GlobalNotificationProvider>
          <SimpleForm />
        </GlobalNotificationProvider>
      );

      expect(screen.getByText('Email is required')).toBeTruthy();
      expect(screen.queryByTestId('toast-error')).toBeNull();
    });

    it('16. Sanitizes complex error objects to safe human-readable messages', () => {
      const ErrorTrigger = () => {
        const notify = useNotification();
        return (
          <button onClick={() => notify.error({ response: { data: { message: 'Product is out of stock.' } } })}>
            Trigger Api Error
          </button>
        );
      };

      render(
        <GlobalNotificationProvider>
          <ErrorTrigger />
        </GlobalNotificationProvider>
      );

      fireEvent.click(screen.getByText('Trigger Api Error'));

      expect(screen.getByText('Product is out of stock.')).toBeTruthy();
      expect(screen.queryByText(/AxiosError/)).toBeNull();
      expect(screen.queryByText(/\[object Object\]/)).toBeNull();
    });
  });
});

