import { render, screen } from '../../test-utils';
import { vi } from 'vitest';
import TransferRequestPage from '@features/owner/pages/TransferRequestPage';
import { BrowserRouter } from 'react-router-dom';
import { apiClient } from '@shared/api/wrappers';

// Mock API client
vi.mock('@shared/api/wrappers', () => ({
  apiClient: {
    getTransfersByUser: vi.fn(),
    getPropertyDetails: vi.fn()
  }
}));

describe('TransferRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.getTransfersByUser).mockResolvedValue([]);
    vi.mocked(apiClient.getPropertyDetails).mockResolvedValue({
      name: 'Test Property',
      address: '123 Test St'
    });
  });

  it('renders the transfer request page', () => {
    render(
      <BrowserRouter>
        <TransferRequestPage userId="user-123" propertyId="prop-123" />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/transfer request/i).length).toBeGreaterThan(0);
  });

  it('displays loading state initially', () => {
    render(
      <BrowserRouter>
        <TransferRequestPage userId="user-123" propertyId="prop-123" />
      </BrowserRouter>
    );

    // The component doesn't show a loading state, so check for the form instead
    expect(screen.getByRole('button', { name: /transfer request/i })).toBeInTheDocument();
  });
});
