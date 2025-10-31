import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import OldOwnerTransferDialog from '../OldOwnerTransferDialog';
import { apiClient } from '../../api/wrappers';

// Mock API client
vi.mock('../../api/wrappers', () => ({
  apiClient: {
    getPropertyList: vi.fn(),
    getPropertyOwners: vi.fn(),
    getUserInfoByEmail: vi.fn()
  }
}));

describe('OldOwnerTransferDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.getPropertyList).mockResolvedValue([
      { propertyId: 'prop-1', name: 'Property 1' }
    ]);
    vi.mocked(apiClient.getPropertyOwners).mockResolvedValue([
      { email: 'owner@example.com' }
    ]);
    vi.mocked(apiClient.getUserInfoByEmail).mockResolvedValue({
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
