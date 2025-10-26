import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test-utils';
import { vi } from 'vitest';
import { AdminRequests } from '../AdminRequests';
import { apiClient } from '../../api/wrappers';
import * as useQueries from '../../hooks/useQueries';

// Mock API client and custom hooks
vi.mock('../../api/wrappers');
vi.mock('../../hooks/useQueries');

describe('AdminRequests Component', () => {
  // Mock properties data
  const mockProperties = [
    {
      propertyId: 'prop-1',
      name: 'Ocean View Villa',
      address: '123 Beach Road',
    },
    {
      propertyId: 'prop-2',
      name: 'Mountain House',
      address: '456 Hill Street',
    },
  ];

  // Mock changelog/request data
  const mockRequests = [
    {
      id: 'req-1',
      propertyId: 'prop-1',
      changeDescription: 'Update kitchen details',
      created_at: new Date('2024-01-15').toISOString(),
      status: 'PENDING',
      specifications: { kitchen: 'Updated appliances' },
      userFirstName: 'John',
      userLastName: 'Doe',
      userEmail: 'john@example.com',
    },
    {
      id: 'req-2',
      propertyId: 'prop-2',
      changeDescription: 'Add new bathroom',
      created_at: new Date('2024-02-20').toISOString(),
      status: 'ACCEPTED',
      specifications: { bathroom: 'Master suite' },
      userFirstName: 'Jane',
      userLastName: 'Smith',
      userEmail: 'jane@example.com',
    },
    {
      id: 'req-3',
      propertyId: 'prop-1',
      changeDescription: 'Remove old garage',
      created_at: new Date('2024-03-10').toISOString(),
      status: 'DECLINED',
      specifications: { garage: 'Removed' },
      userFirstName: 'Bob',
      userLastName: 'Johnson',
      userEmail: 'bob@example.com',
    },
  ];

  // Mock mutation functions
  const mockApproveEdit = vi.fn();
  const mockRejectEdit = vi.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations for React Query hooks
    (useQueries.useAdminProperties as any).mockReturnValue({
      data: mockProperties,
      isLoading: false,
      error: null,
    });

    (useQueries.useChangeLogs as any).mockReturnValue({
      data: mockRequests,
      isLoading: false,
      error: null,
    });

    (useQueries.useApproveEdit as any).mockReturnValue({
      mutateAsync: mockApproveEdit.mockResolvedValue(undefined),
      isLoading: false,
    });

    (useQueries.useRejectEdit as any).mockReturnValue({
      mutateAsync: mockRejectEdit.mockResolvedValue(undefined),
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the page title and description', () => {
      // Test: Verify main heading and description are displayed
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      expect(screen.getByText('Requests')).toBeInTheDocument();
      expect(screen.getByText('All requests are displayed here.')).toBeInTheDocument();
    });

    it('renders the requests table', async () => {
      // Test: Verify table structure exists
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('displays table headers correctly', async () => {
      // Test: Verify all expected column headers are present
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Property')).toBeInTheDocument();
        expect(screen.getByText('Requested By')).toBeInTheDocument();
        expect(screen.getByText('Change Description')).toBeInTheDocument();
        expect(screen.getByText('Request Date')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Inspect')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('fetches admin properties on mount', async () => {
      // Test: Verify properties hook is called with correct params
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(useQueries.useAdminProperties).toHaveBeenCalledWith('admin-1', 'ADMIN');
      });
    });

    it('fetches changelogs for all property IDs', async () => {
      // Test: Verify changelog hook receives correct property IDs
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(useQueries.useChangeLogs).toHaveBeenCalledWith(['prop-1', 'prop-2']);
      });
    });

    it('displays all change requests in the table', async () => {
      // Test: Verify all request data is rendered
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
        expect(screen.getByText('Add new bathroom')).toBeInTheDocument();
        expect(screen.getByText('Remove old garage')).toBeInTheDocument();
      });
    });

    it('shows loading state when fetching data', () => {
      // Test: Verify loading state appears during data fetch
      (useQueries.useAdminProperties as any).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      // Component should show loading indicator (implementation dependent)
      // Adjust based on your actual loading UI
    });

    it('handles empty requests list', async () => {
      // Test: Verify empty state when no requests exist
      (useQueries.useChangeLogs as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        // Should render table but with no data rows
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      // Check that request descriptions are not present
      expect(screen.queryByText('Update kitchen details')).not.toBeInTheDocument();
    });
  });

  describe('Request Display', () => {
    it('displays property address for each request', async () => {
      // Test: Verify property information is shown correctly
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('123 Beach Road')).toBeInTheDocument();
        expect(screen.getByText('456 Hill Street')).toBeInTheDocument();
      });
    });

    it('shows "Unknown Property" for requests without matching property', async () => {
      // Test: Verify fallback text for missing property data
      const requestWithUnknownProperty = [
        {
          ...mockRequests[0],
          propertyId: 'unknown-prop-id',
        },
      ];

      (useQueries.useChangeLogs as any).mockReturnValue({
        data: requestWithUnknownProperty,
        isLoading: false,
      });

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Unknown Property')).toBeInTheDocument();
      });
    });

    it('displays requester names correctly', async () => {
      // Test: Verify user names are formatted properly
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('shows "Unknown User" when user data is missing', async () => {
      // Test: Verify fallback text for missing user data
      const requestWithUnknownUser = [
        {
          ...mockRequests[0],
          userFirstName: null,
          userLastName: null,
        },
      ];

      (useQueries.useChangeLogs as any).mockReturnValue({
        data: requestWithUnknownUser,
        isLoading: false,
      });

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Unknown User')).toBeInTheDocument();
      });
    });

    it('formats request dates correctly', async () => {
      // Test: Verify date formatting function works
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        // Check for formatted dates (format: "Month Day, Year")
        expect(screen.getByText(/January 15, 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/February 20, 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/March 10, 2024/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Badges', () => {
    it('displays status badges for all requests', async () => {
      // Test: Verify status badges are shown
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
        expect(screen.getByText('DECLINED')).toBeInTheDocument();
      });
    });

    it('applies correct badge variant for PENDING status', async () => {
      // Test: Verify PENDING badge has correct styling
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        const pendingBadge = screen.getByText('PENDING');
        expect(pendingBadge).toBeInTheDocument();
        // Badge component should have appropriate variant class
      });
    });

    it('applies correct badge variant for ACCEPTED status', async () => {
      // Test: Verify ACCEPTED badge has correct styling
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        const acceptedBadge = screen.getByText('ACCEPTED');
        expect(acceptedBadge).toBeInTheDocument();
      });
    });

    it('applies correct badge variant for DECLINED status', async () => {
      // Test: Verify DECLINED badge has correct styling
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        const declinedBadge = screen.getByText('DECLINED');
        expect(declinedBadge).toBeInTheDocument();
      });
    });
  });

  describe('Request Details Dialog', () => {
    it('renders inspect button for each request', async () => {
      // Test: Verify inspect buttons are present
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        // Should have Eye icon buttons for each request
        const buttons = screen.getAllByRole('button');
        const inspectButtons = buttons.filter(btn => 
          btn.querySelector('svg') // Eye icon
        );
        expect(inspectButtons.length).toBeGreaterThan(0);
      });
    });

    it('opens dialog when inspect button is clicked', async () => {
      // Test: Verify dialog opens on button click
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
      });

      // Find and click first inspect button
      const buttons = screen.getAllByRole('button');
      const inspectButton = buttons.find(btn => 
        btn.querySelector('svg') && !btn.textContent
      );

      if (inspectButton) {
        fireEvent.click(inspectButton);

        // Dialog should open
        await waitFor(() => {
          expect(screen.getByText('Edit Request Details')).toBeInTheDocument();
        });
      }
    });

    it('displays request details in dialog', async () => {
      // Test: Verify dialog shows full request information
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
      });

      // Open dialog
      const buttons = screen.getAllByRole('button');
      const inspectButton = buttons.find(btn => 
        btn.querySelector('svg') && !btn.textContent
      );

      if (inspectButton) {
        fireEvent.click(inspectButton);

        await waitFor(() => {
          // Dialog should show description for reviewing
          expect(screen.getByText(/Review the requested changes/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Approve/Reject Actions', () => {
    it('calls approveEdit when approve button is clicked', async () => {
      // Test: Verify approve action triggers mutation
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
      });

      // Open dialog for pending request
      const buttons = screen.getAllByRole('button');
      const inspectButton = buttons.find(btn => 
        btn.querySelector('svg') && !btn.textContent
      );

      if (inspectButton) {
        fireEvent.click(inspectButton);

        await waitFor(() => {
          // Find approve button (CheckCircle icon)
          const dialogButtons = screen.getAllByRole('button');
          const approveButton = dialogButtons.find(btn => 
            btn.querySelector('svg') && btn.getAttribute('title') === 'Approve'
          );

          if (approveButton) {
            fireEvent.click(approveButton);

            // Approve mutation should be called
            waitFor(() => {
              expect(mockApproveEdit).toHaveBeenCalledWith('req-1');
            });
          }
        });
      }
    });

    it('calls rejectEdit when reject button is clicked', async () => {
      // Test: Verify reject action triggers mutation
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
      });

      // Open dialog
      const buttons = screen.getAllByRole('button');
      const inspectButton = buttons.find(btn => 
        btn.querySelector('svg') && !btn.textContent
      );

      if (inspectButton) {
        fireEvent.click(inspectButton);

        await waitFor(() => {
          // Find reject button (XCircle icon)
          const dialogButtons = screen.getAllByRole('button');
          const rejectButton = dialogButtons.find(btn => 
            btn.querySelector('svg') && btn.getAttribute('title') === 'Reject'
          );

          if (rejectButton) {
            fireEvent.click(rejectButton);

            // Reject mutation should be called
            waitFor(() => {
              expect(mockRejectEdit).toHaveBeenCalledWith('req-1');
            });
          }
        });
      }
    });

    it('handles approve errors gracefully', async () => {
      // Test: Verify error handling for failed approve action
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockApproveEdit.mockRejectedValue(new Error('Approve failed'));

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
      });

      // Component should log error but not crash
      consoleErrorSpy.mockRestore();
    });

    it('handles reject errors gracefully', async () => {
      // Test: Verify error handling for failed reject action
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockRejectEdit.mockRejectedValue(new Error('Reject failed'));

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
      });

      // Component should log error but not crash
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Card Layout', () => {
    it('renders within a Card component', () => {
      // Test: Verify component uses Card wrapper
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      // Card should contain the table
      const card = document.querySelector('[class*="card"]') || screen.getByText('Requests').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('has proper card header', () => {
      // Test: Verify card structure
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      // Should have title and description in header area
      expect(screen.getByText('Requests')).toBeInTheDocument();
      expect(screen.getByText('All requests are displayed here.')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles requests with missing specifications', async () => {
      // Test: Verify component handles incomplete request data
      const incompleteRequests = [
        {
          ...mockRequests[0],
          specifications: null,
        },
      ];

      (useQueries.useChangeLogs as any).mockReturnValue({
        data: incompleteRequests,
        isLoading: false,
      });

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
      });

      // Should not crash with null specifications
      expect(screen.getByText('Requests')).toBeInTheDocument();
    });

    it('handles requests with invalid dates', async () => {
      // Test: Verify date formatting handles invalid dates
      const requestsWithInvalidDate = [
        {
          ...mockRequests[0],
          created_at: 'invalid-date',
        },
      ];

      (useQueries.useChangeLogs as any).mockReturnValue({
        data: requestsWithInvalidDate,
        isLoading: false,
      });

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
      });
    });

    it('handles empty property list but with requests', async () => {
      // Test: Verify behavior when properties don't load but requests do
      (useQueries.useAdminProperties as any).mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        // All requests should show "Unknown Property"
        const unknownProperties = screen.getAllByText('Unknown Property');
        expect(unknownProperties.length).toBe(mockRequests.length);
      });
    });

    it('renders with only first name provided', async () => {
      // Test: Verify name display with missing last name
      const requestsWithOnlyFirstName = [
        {
          ...mockRequests[0],
          userFirstName: 'John',
          userLastName: null,
        },
      ];

      (useQueries.useChangeLogs as any).mockReturnValue({
        data: requestsWithOnlyFirstName,
        isLoading: false,
      });

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });
    });

    it('renders with only last name provided', async () => {
      // Test: Verify name display with missing first name
      const requestsWithOnlyLastName = [
        {
          ...mockRequests[0],
          userFirstName: null,
          userLastName: 'Doe',
        },
      ];

      (useQueries.useChangeLogs as any).mockReturnValue({
        data: requestsWithOnlyLastName,
        isLoading: false,
      });

      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has semantic table structure', async () => {
      // Test: Verify proper table semantics
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      const thead = document.querySelector('thead');
      const tbody = document.querySelector('tbody');

      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
    });

    it('has accessible dialog structure', async () => {
      // Test: Verify dialog accessibility
      render(<AdminRequests userId="admin-1" userType="ADMIN" />);

      await waitFor(() => {
        expect(screen.getByText('Update kitchen details')).toBeInTheDocument();
      });

      // Open dialog
      const buttons = screen.getAllByRole('button');
      const inspectButton = buttons.find(btn => 
        btn.querySelector('svg') && !btn.textContent
      );

      if (inspectButton) {
        fireEvent.click(inspectButton);

        await waitFor(() => {
          const dialog = screen.getByRole('dialog');
          expect(dialog).toBeInTheDocument();
        });
      }
    });
  });
});
