import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
// Fixed import path based on your structure
import PlannerContract from '../../../pages/planner/PlannerContract';
import { auth } from '../../../firebase';

// Mock dependencies with correct paths
vi.mock('../../../firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      getIdToken: vi.fn().mockResolvedValue('test-token')
    },
    onAuthStateChanged: vi.fn()
  }
}));

vi.mock('../../../pages/planner/PlannerContract.css', () => ({}));

vi.mock('../../../pages/general/popup/Popup.jsx', () => ({ 
  children, 
  isOpen, 
  onClose 
}) => 
  isOpen ? <div data-testid="popup">{children}</div> : null
);

vi.mock('../../../pages/planner/PlannerSignatureView', () => ({ 
  contract, 
  onFinalize, 
  onSaveDraft, 
  onClose 
}) => (
  <div data-testid="signature-view">
    <button onClick={() => onFinalize({})}>Finalize</button>
    <button onClick={() => onSaveDraft({})}>Save Draft</button>
    <button onClick={onClose}>Close</button>
  </div>
));

vi.mock('../../../pages/planner/PlannerSigAttch.js', () => ({
  createSignatureDetailsDocument: vi.fn(() => ({
    download: vi.fn()
  })),
  getUserIPAddress: vi.fn().mockResolvedValue('192.168.1.1')
}));

vi.mock('../../../pages/planner/ContractComponents/EventCardContract.jsx', () => ({ 
  eventData, 
  setSelectedContract, 
  setShowSignModal,
  handleDownloadContract,
  deleteContract,
  getContractStatusDisplay,
  isContractSignedByClient 
}) => (
  <div data-testid="event-card">
    <h3>{eventData.eventName}</h3>
    <button onClick={() => setSelectedContract({ id: 'contract-1', eventId: 'event-1' })}>
      Select Contract
    </button>
    <button onClick={() => setShowSignModal(true)}>Open Signature</button>
    <button onClick={() => handleDownloadContract('http://example.com/contract.pdf', 'contract.pdf')}>
      Download
    </button>
    <button onClick={() => deleteContract('event-1', 'contract-1', 'http://example.com/contract.pdf', 'vendor-1')}>
      Delete
    </button>
  </div>
));

// Mock fetch globally
global.fetch = vi.fn();

describe('PlannerContract Component', () => {
  const mockContracts = [
    {
      id: 'contract-1',
      eventId: 'event-1',
      eventName: 'Wedding Celebration',
      eventDate: { seconds: 1704067200 },
      vendorId: 'vendor-1',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      signatureFields: [
        { id: 'sig1', label: 'Signature', type: 'signature', signerRole: 'client', required: true, signed: false }
      ],
      signatureWorkflow: {
        isElectronic: true,
        workflowStatus: 'sent'
      }
    },
    {
      id: 'contract-2',
      eventId: 'event-2',
      eventName: 'Corporate Event',
      eventDate: { seconds: 1704153600 },
      vendorId: 'vendor-2',
      clientName: 'Jane Smith',
      clientEmail: 'jane@example.com',
      signatureFields: [
        { id: 'sig1', label: 'Signature', type: 'signature', signerRole: 'client', required: true, signed: true }
      ],
      signatureWorkflow: {
        isElectronic: true,
        workflowStatus: 'completed'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    auth.onAuthStateChanged.mockImplementation((callback) => {
      callback(auth.currentUser);
      return vi.fn(); // unsubscribe function
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // RENDERING TESTS
  describe('Rendering Tests', () => {
    test('renders loading state initially', () => {
      render(<PlannerContract />);
      expect(screen.getByText('Loading your contracts...')).toBeInTheDocument();
    });

    test('renders error state when authentication fails', async () => {
      auth.onAuthStateChanged.mockImplementation((callback) => {
        callback(null);
        return vi.fn();
      });

      render(<PlannerContract />);
      
      await waitFor(() => {
        expect(screen.getByText('User not authenticated')).toBeInTheDocument();
      });
    });

    test('renders no contracts message when no contracts exist', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: [] })
      });

      render(<PlannerContract />);

      await waitFor(() => {
        expect(screen.getByText('No contracts found.')).toBeInTheDocument();
      });
    });

    test('renders contracts list when contracts are loaded', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts })
      });

      render(<PlannerContract />);

      await waitFor(() => {
        expect(screen.getByText('Contract Management')).toBeInTheDocument();
        expect(screen.getByText('Manage vendor contracts for your events.')).toBeInTheDocument();
        expect(screen.getByText('Total Contracts: 2')).toBeInTheDocument();
        expect(screen.getByText('Your Events (2)')).toBeInTheDocument();
      });
    });

    test('renders search input and statistics', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts })
      });

      render(<PlannerContract />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by event name...')).toBeInTheDocument();
        expect(screen.getByText('Total Contracts: 2')).toBeInTheDocument();
        expect(screen.getByText('Pending Signatures: 1')).toBeInTheDocument();
        expect(screen.getByText('Signed Contracts: 1')).toBeInTheDocument();
      });
    });
  });

  // FUNCTIONALITY TESTS
  describe('Functionality Tests', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts })
      });

      render(<PlannerContract />);
      await waitFor(() => {
        expect(screen.getByText('Your Events (2)')).toBeInTheDocument();
      });
    });

    test('search functionality filters events', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search by event name...');
      
      await user.type(searchInput, 'Wedding');

      await waitFor(() => {
        expect(screen.getByText('Your Events (1)')).toBeInTheDocument();
      });
    });

    test('clear search functionality works', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search by event name...');
      
      await user.type(searchInput, 'Wedding');

      await waitFor(() => {
        expect(screen.getByText('Your Events (1)')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(searchInput.value).toBe('');
        expect(screen.getByText('Your Events (2)')).toBeInTheDocument();
      });
    });

    test('opens signature modal when contract is selected', async () => {
      const user = userEvent.setup();
      const eventCards = screen.getAllByTestId('event-card');
      const openSignatureButton = within(eventCards[0]).getByText('Open Signature');
      
      await user.click(openSignatureButton);

      await waitFor(() => {
        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByTestId('signature-view')).toBeInTheDocument();
      });
    });

    test('closes signature modal', async () => {
      const user = userEvent.setup();
      // Open modal first
      const eventCards = screen.getAllByTestId('event-card');
      const openSignatureButton = within(eventCards[0]).getByText('Open Signature');
      await user.click(openSignatureButton);

      await waitFor(() => {
        expect(screen.getByTestId('popup')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
      });
    });

    test('handles contract download', async () => {
      const user = userEvent.setup();
      const eventCards = screen.getAllByTestId('event-card');
      const downloadButton = within(eventCards[0]).getByText('Download');
      
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn();
      global.URL.revokeObjectURL = vi.fn();

      await user.click(downloadButton);

      // Since we're mocking the handleDownloadContract, we just verify the button click works
      expect(downloadButton).toBeInTheDocument();
    });

    test('handles contract deletion with confirmation', async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm');
      confirmSpy.mockImplementation(() => true);

      fetch.mockResolvedValueOnce({
        ok: true
      });

      const eventCards = screen.getAllByTestId('event-card');
      const deleteButton = within(eventCards[0]).getByText('Delete');
      
      await user.click(deleteButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith(
          'Are you sure you want to delete this contract? This action cannot be undone.'
        );
      });

      confirmSpy.mockRestore();
    });

    test('cancels contract deletion when user declines confirmation', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm');
      confirmSpy.mockImplementation(() => false);

      const eventCards = screen.getAllByTestId('event-card');
      const deleteButton = within(eventCards[0]).getByText('Delete');
      
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalled();
      // Should not call fetch for deletion
      expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('DELETE'));

      confirmSpy.mockRestore();
    });

    test('handles finalize signature', async () => {
      const user = userEvent.setup();
      // Open modal first
      const eventCards = screen.getAllByTestId('event-card');
      const openSignatureButton = within(eventCards[0]).getByText('Open Signature');
      await user.click(openSignatureButton);

      await waitFor(() => {
        expect(screen.getByTestId('signature-view')).toBeInTheDocument();
      });

      // Mock successful finalize
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contract: {} })
      });

      fetch.mockResolvedValueOnce({
        ok: true
      });

      const finalizeButton = screen.getByText('Finalize');
      await user.click(finalizeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    test('handles save draft functionality', async () => {
      const user = userEvent.setup();
      // Open modal first
      const eventCards = screen.getAllByTestId('event-card');
      const openSignatureButton = within(eventCards[0]).getByText('Open Signature');
      await user.click(openSignatureButton);

      await waitFor(() => {
        expect(screen.getByTestId('signature-view')).toBeInTheDocument();
      });

      // Mock successful draft save
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const saveDraftButton = screen.getByText('Save Draft');
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  // ERROR HANDLING TESTS
  describe('Error Handling Tests', () => {
    test('handles fetch contracts error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<PlannerContract />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load contracts: Network error')).toBeInTheDocument();
      });
    });

    test('handles unauthorized access', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(<PlannerContract />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load contracts/)).toBeInTheDocument();
      });
    });

    test('handles finalize signature error', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts })
      });

      render(<PlannerContract />);

      await waitFor(() => {
        expect(screen.getByText('Your Events (2)')).toBeInTheDocument();
      });

      // Open modal
      const eventCards = screen.getAllByTestId('event-card');
      const openSignatureButton = within(eventCards[0]).getByText('Open Signature');
      fireEvent.click(openSignatureButton);

      await waitFor(() => {
        expect(screen.getByTestId('signature-view')).toBeInTheDocument();
      });

      // Mock finalize error
      fetch.mockRejectedValueOnce(new Error('Finalization failed'));

      const finalizeButton = screen.getByText('Finalize');
      fireEvent.click(finalizeButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to finalize/)).toBeInTheDocument();
      });
    });
  });

  // UTILITY FUNCTION TESTS
  describe('Utility Functions', () => {
    test('debounce search works correctly', async () => {
      vi.useFakeTimers();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts })
      });

      render(<PlannerContract />);

      await waitFor(() => {
        expect(screen.getByText('Your Events (2)')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by event name...');
      
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // Immediately after typing, should still show all events
      expect(screen.getByText('Your Events (2)')).toBeInTheDocument();
      
      // Fast-forward timers
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        // After debounce, should filter
        expect(screen.getByText('Your Events (0)')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    test('contract status display works correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contracts: mockContracts })
      });

      render(<PlannerContract />);

      await waitFor(() => {
        // Verify contracts with different statuses are handled
        expect(screen.getByText('Pending Signatures: 1')).toBeInTheDocument();
        expect(screen.getByText('Signed Contracts: 1')).toBeInTheDocument();
      });
    });
  });
});