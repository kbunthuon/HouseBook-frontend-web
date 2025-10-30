import { render, screen } from '../../test-utils';
import { vi } from 'vitest';
import TransferRequestPage from '../TransferRequestPage';
import { BrowserRouter } from 'react-router-dom';

// Mock API client
const mockGetTransfersByUser = vi.fn();
const mockGetPropertyDetails = vi.fn();

vi.mock('../../api/wrappers', () => ({
  apiClient: {
    getTransfersByUser: mockGetTransfersByUser,
    getPropertyDetails: mockGetPropertyDetails
  }
}));

describe('TransferRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransfersByUser.mockResolvedValue([]);
    mockGetPropertyDetails.mockResolvedValue({
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

    expect(screen.getByText(/transfer request/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(
      <BrowserRouter>
        <TransferRequestPage userId="user-123" propertyId="prop-123" />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
