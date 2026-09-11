import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminProducts from '../AdminProducts';
import adminApi from '../../../utils/adminApi';
import { GlobalNotificationProvider } from '../../../context/GlobalNotificationProvider';

// Mock browser globals for jsdom
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('../../../utils/adminApi');

const mockProducts = [
  {
    _id: 'prod-1',
    name: 'iPhone 15 Pro',
    brand: 'Apple',
    category: 'Smartphones',
    originalPrice: 129900,
    offerPrice: 119900,
    stock: 10,
    isFeatured: true,
    primaryImage: { url: 'https://blob.vercel-storage.com/p/iphone15.jpg' },
  },
  {
    _id: 'prod-2',
    name: 'Samsung Galaxy S24',
    brand: 'Samsung',
    category: 'Smartphones',
    originalPrice: 89999,
    offerPrice: 79999,
    stock: 5,
    isFeatured: false,
    primaryImage: { url: 'https://blob.vercel-storage.com/p/s24.jpg' },
  },
];

describe('AdminProducts Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.get.mockResolvedValue({
      data: {
        success: true,
        products: mockProducts,
        page: 1,
        pages: 3,
        total: 25,
      },
    });
  });

  const renderComponent = () =>
    render(
      <GlobalNotificationProvider>
        <AdminProducts />
      </GlobalNotificationProvider>
    );

  it('renders products table with active products', async () => {
    renderComponent();

    expect(await screen.findByText('iPhone 15 Pro')).toBeTruthy();
    expect(screen.getByText('Samsung Galaxy S24')).toBeTruthy();
    expect(screen.getByText('Active Products')).toBeTruthy();
    expect(screen.getByText('Trash / Archived')).toBeTruthy();
  });

  it('handles row selection and displays sticky bulk action bar', async () => {
    renderComponent();

    const rowCheckboxes = await screen.findAllByRole('checkbox', { name: /^Select (?!all)/ });
    expect(rowCheckboxes.length).toBe(2);

    // Select first product
    fireEvent.click(rowCheckboxes[0]);

    // Sticky bulk action bar appears
    expect(await screen.findByText(/product.*selected/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Archive Selected/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy();

    // Click Clear
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => {
      expect(screen.queryByText(/product.*selected/i)).toBeNull();
    });
  });

  it('header checkbox selects all visible products and shows select all matching banner', async () => {
    renderComponent();

    const headerCheckbox = await screen.findByRole('checkbox', { name: 'Select all visible products' });
    fireEvent.click(headerCheckbox);

    // Banner for selecting all 25 products across pages appears
    const selectAllMatchingBtn = await screen.findByRole('button', { name: /Select all 25 matching products/i });
    expect(selectAllMatchingBtn).toBeTruthy();

    // Click select all matching
    fireEvent.click(selectAllMatchingBtn);

    expect(await screen.findByText(/matching products are selected across all pages/i)).toBeTruthy();
  });

  it('switches to Trash/Archived tab and requests archived products', async () => {
    adminApi.get.mockImplementation((url) => {
      if (url.includes('status=archived')) {
        return Promise.resolve({
          data: {
            success: true,
            products: [
              {
                _id: 'prod-archived-1',
                name: 'Old Oppo Phone',
                brand: 'Oppo',
                category: 'Smartphones',
                offerPrice: 15000,
                stock: 0,
                archivedAt: '2026-09-10T12:00:00Z',
                archivedBy: { email: 'admin@akmobiles.com' },
              },
            ],
            page: 1,
            pages: 1,
            total: 1,
          },
        });
      }
      return Promise.resolve({
        data: { success: true, products: mockProducts, page: 1, pages: 1, total: 2 },
      });
    });

    renderComponent();

    const trashTab = await screen.findByText('Trash / Archived');
    fireEvent.click(trashTab);

    expect(await screen.findByText('Old Oppo Phone')).toBeTruthy();
    expect(screen.getByText(/admin@akmobiles.com/)).toBeTruthy();
    expect(screen.getByTitle('Restore Product')).toBeTruthy();
  });
});
