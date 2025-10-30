import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import OldOwnerTransferDialog from '../OldOwnerTransferDialog';

// Mock API client
const mockGetPropertyList = vi.fn();
const mockGetPropertyOwners = vi.fn();
const mockGetUserInfoByEmail = vi.fn();

vi.mock('../../api/wrappers', () => ({
  apiClient: {
    getPropertyList: mockGetPropertyList,
    getPropertyOwners: mockGetPropertyOwners,
    getUserInfoByEmail: mockGetUserInfoByEmail
  }
}));

describe('OldOwnerTransferDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPropertyList.mockResolvedValue([
      { propertyId: 'prop-1', name: 'Property 1' }
    ]);
    mockGetPropertyOwners.mockResolvedValue([
      { email: 'owner@example.com' }
    ]);
    mockGetUserInfoByEmail.mockResolvedValue({
      userId: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890'
    });
  });

  it('renders the dialog when open', async () => {
    render(
      <OldOwnerTransferDialog
        open={true}
        onOpenChange={vi.fn()}
        userID="user-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/initiate property transfer/i)).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    render(
      <OldOwnerTransferDialog
        open={false}
        onOpenChange={vi.fn()}
        userID="user-123"
      />
    );

    expect(screen.queryByText(/initiate property transfer/i)).not.toBeInTheDocument();
  });

  it('displays property selection dropdown', async () => {
    render(
      <OldOwnerTransferDialog
        open={true}
        onOpenChange={vi.fn()}
        userID="user-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/select property/i)).toBeInTheDocument();
    });
  });

  it('shows invite new owners section', async () => {
    render(
      <OldOwnerTransferDialog
        open={true}
        onOpenChange={vi.fn()}
        userID="user-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/invite new owners/i)).toBeInTheDocument();
    });
  });
});
