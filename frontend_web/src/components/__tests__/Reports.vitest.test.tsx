import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { Reports } from '../Reports';

// Mock API client
const mockGetUserInfoByEmail = vi.fn();
const mockGetPropertyList = vi.fn();

vi.mock('../../api/wrappers', () => ({
  apiClient: {
    getUserInfoByEmail: mockGetUserInfoByEmail,
    getPropertyList: mockGetPropertyList
  }
}));

describe('Reports', () => {
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
  });

  it('renders reports page', async () => {
    render(<Reports userId="user-123" userType="owner" />);

    await waitFor(() => {
      expect(screen.getByText(/reports/i)).toBeInTheDocument();
    });
  });

  it('displays property selector', async () => {
    render(<Reports userId="user-123" userType="owner" />);

    await waitFor(() => {
      expect(screen.getByText(/select property/i)).toBeInTheDocument();
    });
  });
});
