import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders correctly when open with title and message', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Archive 12 products?"
        message="These products will be removed from the storefront."
        confirmText="Archive 12 Products"
        cancelText="Cancel"
        variant="danger"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText('Archive 12 products?')).toBeTruthy();
    expect(screen.getByText(/These products will be removed from the storefront/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Archive 12 Products' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Log out of Admin?"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Log out of Admin?"
        confirmText="Log Out"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Log Out' });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('requires typing confirmationKeyword before enabling confirm button', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Archive all 53 matching products?"
        confirmText="Archive All 53 Products"
        confirmationKeyword="DELETE"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Archive All 53 Products' });
    expect(confirmBtn.disabled).toBe(true);

    const input = screen.getByPlaceholderText('Type "DELETE"');
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: 'DEL' } });
    expect(confirmBtn.disabled).toBe(true);

    fireEvent.change(input, { target: { value: 'DELETE' } });
    expect(confirmBtn.disabled).toBe(false);

    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press when not loading', () => {
    const handleCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Escape Test"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
