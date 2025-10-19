import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

// Mock react-router-dom useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock Firebase auth
const mockGetIdToken = vi.fn(() => Promise.resolve('mock-token'));
const mockOnAuthStateChanged = vi.fn();
const mockUser = { uid: 'test-vendor', getIdToken: mockGetIdToken };

vi.mocked(getAuth).mockReturnValue({
  currentUser: mockUser,
  onAuthStateChanged: mockOnAuthStateChanged,
});

// Mock global fetch
beforeAll(() => { global.fetch = vi.fn(); });
afterAll(() => { vi.restoreAllMocks(); });

// Import component AFTER mocks
import VendorProfile from '../../pages/vendor/VendorProfile';

describe('VendorProfile', () => {
  const mockVendorData = { businessName: 'Test Vendor', category: 'Catering' };
  const mockServices = [{ id: 's1', serviceName: 'Buffet', cost: '500' }];

  const renderComponent = () => render(
    <MemoryRouter><VendorProfile /></MemoryRouter>
  );

  beforeEach(() => {
    mockNavigate.mockClear();
    global.fetch.mockClear();
    mockGetIdToken.mockResolvedValue('mock-token');
    mockOnAuthStateChanged.mockImplementation(cb => { cb(mockUser); return vi.fn(); });
    global.confirm = vi.fn(() => true);
  });

  it('shows loading initially', () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockVendorData) })
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockServices) });

    renderComponent();
    expect(screen.getByText(/Loading your profile/i)).toBeInTheDocument();
  });

  it('renders vendor profile after fetch', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockVendorData) })
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockServices) });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Test Vendor')).toBeInTheDocument());
    expect(screen.getByText('Catering')).toBeInTheDocument();

    // Check service rendered
    const serviceName = screen.getByTestId('service-name');
    expect(serviceName).toHaveTextContent('Buffet');
  });

  it('handles unauthenticated user', async () => {
    mockOnAuthStateChanged.mockImplementation(cb => { cb(null); return vi.fn(); });
    renderComponent();

    await waitFor(() => expect(screen.getByText(/User not authenticated/i)).toBeInTheDocument());
  });

  it('adds a service', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockVendorData) })
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ serviceId: 'new-s1' }) });

    renderComponent();
    await waitFor(() => screen.getByText('Test Vendor'));

    const addBtn = screen.getByRole('button', { name: /Add Service/i });
    fireEvent.click(addBtn);

    const modal = screen.getByText(/Add New Service/i).closest('.modal-content');
    const nameInput = within(modal).getByPlaceholderText(/e.g., Catering, Photography/i);
    const costInput = within(modal).getByPlaceholderText(/e.g., 10000/i);

    fireEvent.change(nameInput, { target: { value: 'Premium Catering' } });
    fireEvent.change(costInput, { target: { value: '1500' } });

    const saveBtn = within(modal).getByRole('button', { name: /Add Service/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/vendors/test-vendor/services'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

 
  
  

  it('navigates to edit profile', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockVendorData) })
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    renderComponent();
    await waitFor(() => screen.getByText('Test Vendor'));

    fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/vendor/vendor-edit-profile');
  });
});
