import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { MyReports } from '@features/reports/pages/MyReports';
import { apiClient } from '@shared/api/wrappers';

// Mock backend services
vi.mock('../../../../backend/JobService', () => ({
  fetchJobsInfo: vi.fn(() => Promise.resolve([[], []])),
  fetchJobAssets: vi.fn(() => Promise.resolve([])),
  fetchJobAssetsWithDetails: vi.fn(() => Promise.resolve([]))
}));

// Mock API client
vi.mock('@shared/api/wrappers', () => ({
  apiClient: {
    getUserInfoByEmail: vi.fn(),
    getPropertyList: vi.fn(),
    getPropertyDetails: vi.fn(),
    getPropertyImages: vi.fn(),
  },
}));

describe('MyReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.getUserInfoByEmail).mockResolvedValue({
      userId: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890'
    });
    vi.mocked(apiClient.getPropertyList).mockResolvedValue([
      { propertyId: 'prop-1', name: 'Property 1' }
    ]);
    vi.mocked(apiClient.getPropertyDetails).mockResolvedValue({
      name: 'Test Property',
      description: 'Test Description',
      address: '123 Test St',
      spaces: []
    });
    vi.mocked(apiClient.getPropertyImages).mockResolvedValue([]);
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
      expect(screen.getAllByText(/report type/i).length).toBeGreaterThan(0);
    });
  });

  it('shows generate report button', async () => {
    render(<MyReports ownerEmail="test@example.com" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate report/i })).toBeInTheDocument();
    });
  });
});
