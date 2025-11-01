import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { Reports } from '../Reports';
import { apiClient } from '@shared/api/wrappers';

// Mock API client
vi.mock('@shared/api/wrappers', () => ({
  apiClient: {
    getUserInfoByEmail: vi.fn(),
    getPropertyList: vi.fn(),
    getAdminProperties: vi.fn()
  }
}));

describe('Reports', () => {
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
    vi.mocked(apiClient.getAdminProperties).mockResolvedValue([
      { propertyId: 'prop-1', name: 'Property 1' }
    ]);
  });

  it('renders reports page', async () => {
    render(<Reports userId="user-123" userType="owner" />);

    await waitFor(() => {
      expect(screen.getByText(/generate new report/i)).toBeInTheDocument();
    });
  });

  it('displays property selector', async () => {
    render(<Reports userId="user-123" userType="owner" />);

    await waitFor(() => {
      expect(screen.getByText(/select property/i)).toBeInTheDocument();
    });
  });
});
