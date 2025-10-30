import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { MyReports } from '../MyReports';

// Mock backend services
vi.mock('../../../../backend/JobService', () => ({
  fetchJobsInfo: vi.fn(() => Promise.resolve([[], []])),
  fetchJobAssets: vi.fn(() => Promise.resolve([])),
  fetchJobAssetsWithDetails: vi.fn(() => Promise.resolve([]))
}));

// Mock API client
const mockGetUserInfoByEmail = vi.fn();
const mockGetPropertyList = vi.fn();
const mockGetPropertyDetails = vi.fn();
const mockGetPropertyImages = vi.fn();

vi.mock('../../api/wrappers', () => ({
  apiClient: {
    getUserInfoByEmail: mockGetUserInfoByEmail,
    getPropertyList: mockGetPropertyList,
    getPropertyDetails: mockGetPropertyDetails,
    getPropertyImages: mockGetPropertyImages
  }
}));

describe('MyReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserInfoByEmail.mockResolvedValue({
      userId: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890'
    });
    mockGetPropertyList.mockResolvedValue([
      { propertyId: 'prop-1', name: 'Property 1' }
    ]);
    mockGetPropertyDetails.mockResolvedValue({
      name: 'Test Property',
      description: 'Test Description',
      address: '123 Test St',
      spaces: []
    });
    mockGetPropertyImages.mockResolvedValue([]);
  });

  it('renders report generation form', async () => {
    render(<MyReports ownerEmail="test@example.com" />);

    await waitFor(() => {
      expect(screen.getByText(/generate new report/i)).toBeInTheDocument();
    });
  });

  it('displays property selection dropdown', async () => {
    render(<MyReports ownerEmail="test@example.com" />);

    await waitFor(() => {
      expect(screen.getByText(/select property/i)).toBeInTheDocument();
    });
  });

  it('displays report type selection', async () => {
    render(<MyReports ownerEmail="test@example.com" />);

    await waitFor(() => {
      expect(screen.getByText(/report type/i)).toBeInTheDocument();
    });
  });

  it('shows generate report button', async () => {
    render(<MyReports ownerEmail="test@example.com" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate report/i })).toBeInTheDocument();
    });
  });
});
