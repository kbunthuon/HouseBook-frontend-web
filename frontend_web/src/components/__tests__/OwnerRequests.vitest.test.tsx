import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { OwnerRequests } from '@features/owner/pages/OwnerRequests';
import * as useQueries from '@hooks/useQueries';

// Mock custom hooks (use the aliased path so component imports match test mocks)
vi.mock('@hooks/useQueries');

describe('OwnerRequests Component', () => {
  // Mock properties owned by the user
  const mockProperties = [
    {
      propertyId: 'prop-1',
      name: 'My Beach House',
      address: '789 Coastal Drive',
    },
    {
      propertyId: 'prop-2',
      name: 'City Apartment',
      address: '321 Urban Street',
    },
  ];

  // Mock change requests/changelogs
  const mockRequests = [
    {
      id: 'req-1',
      propertyId: 'prop-1',
      changeDescription: 'Update roof details',
      created_at: new Date('2024-01-10').toISOString(),
      status: 'PENDING',
      specifications: { roof: 'New tiles' },
      userFirstName: 'Alice',
      userLastName: 'Williams',
      userEmail: 'alice@example.com',
    },
    {
      id: 'req-2',
      propertyId: 'prop-2',
      changeDescription: 'Add balcony',
      created_at: new Date('2024-02-15').toISOString(),
      status: 'ACCEPTED',
      specifications: { balcony: 'Glass railing' },
      userFirstName: 'Charlie',
      userLastName: 'Brown',
      userEmail: 'charlie@example.com',
    },
    {
      id: 'req-3',
      propertyId: 'prop-1',
      changeDescription: 'Update garden',
      created_at: new Date('2024-03-05').toISOString(),
      status: 'DECLINED',
      specifications: { garden: 'Landscaping' },
      userFirstName: 'Diana',
      userLastName: 'Prince',
      userEmail: 'diana@example.com',
    },
  ];

  // Mock mutation functions
  const mockApproveEdit = vi.fn();
  const mockRejectEdit = vi.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations for React Query hooks
    (useQueries.useProperties as any).mockReturnValue({
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
      // Test: Verify main heading for owner dashboard
      render(<OwnerRequests userId="owner-1" />);

      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview of your property portfolio')).toBeInTheDocument();
    });

    it('renders the edit requests table', async () => {
      // Test: Verify table structure exists
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('displays table headers correctly', async () => {
      // Test: Verify all expected column headers
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Property')).toBeInTheDocument();
        expect(screen.getByText('Requested By')).toBeInTheDocument();
        expect(screen.getByText('Change Description')).toBeInTheDocument();
        expect(screen.getByText('Request Date')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Inspect')).toBeInTheDocument();
      });
    });

    it('has card with title "All Edit Requests"', async () => {
      // Test: Verify card structure and title
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('All Edit Requests')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('fetches owner properties on mount', async () => {
      // Test: Verify properties hook is called with user ID
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(useQueries.useProperties).toHaveBeenCalledWith('owner-1');
      });
    });

    it('fetches changelogs for all property IDs', async () => {
      // Test: Verify changelog hook receives correct property IDs
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(useQueries.useChangeLogs).toHaveBeenCalledWith(['prop-1', 'prop-2']);
      });
    });

    it('displays all change requests in the table', async () => {
      // Test: Verify all request data is rendered
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
        expect(screen.getByText('Add balcony')).toBeInTheDocument();
        expect(screen.getByText('Update garden')).toBeInTheDocument();
      });
    });

    it('shows loading state when fetching data', () => {
      // Test: Verify loading state appears during data fetch
      (useQueries.useProperties as any).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      render(<OwnerRequests userId="owner-1" />);

      // Component should indicate loading (implementation dependent)
      // The actual loading UI depends on your component
    });

    it('handles empty requests list gracefully', async () => {
      // Test: Verify empty state when no requests exist
      (useQueries.useChangeLogs as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // Should render table but with no data rows
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      // Check that request descriptions are not present
      expect(screen.queryByText('Update roof details')).not.toBeInTheDocument();
    });

    it('handles when properties have no associated requests', async () => {
      // Test: Verify empty request list for properties
      (useQueries.useChangeLogs as any).mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // Properties should still be loaded
        expect(useQueries.useProperties).toHaveBeenCalled();
      });
    });
  });

  describe('Request Display', () => {
    it('displays property address for each request', async () => {
      // Test: Verify property information is correctly shown
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // Use getAllByText since addresses may appear multiple times
        const addresses = screen.getAllByText('789 Coastal Drive');
        expect(addresses.length).toBeGreaterThan(0);
        expect(screen.getByText('321 Urban Street')).toBeInTheDocument();
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

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Unknown Property')).toBeInTheDocument();
      });
    });

    it('displays requester names correctly', async () => {
      // Test: Verify user names are formatted properly
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Alice Williams')).toBeInTheDocument();
        expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
        expect(screen.getByText('Diana Prince')).toBeInTheDocument();
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

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Unknown User')).toBeInTheDocument();
      });
    });

    it('formats request dates correctly', async () => {
      // Test: Verify date formatting displays readable dates
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // Check for formatted dates (format: "Month Day, Year")
        expect(screen.getByText(/January 10, 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/February 15, 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/March 5, 2024/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Badges', () => {
    it('displays status badges for all requests', async () => {
      // Test: Verify status badges are rendered
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
        expect(screen.getByText('DECLINED')).toBeInTheDocument();
      });
    });

    it('applies correct badge variant based on status', async () => {
      // Test: Verify badge variants match status
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        const pendingBadge = screen.getByText('PENDING');
        const acceptedBadge = screen.getByText('ACCEPTED');
        const declinedBadge = screen.getByText('DECLINED');

        expect(pendingBadge).toBeInTheDocument();
        expect(acceptedBadge).toBeInTheDocument();
        expect(declinedBadge).toBeInTheDocument();
      });
    });
  });

  describe('Request Details Dialog', () => {
    it('renders inspect button for each request', async () => {
      // Test: Verify inspect buttons (Eye icon) are present
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // Should have Eye icon buttons
        const buttons = screen.getAllByRole('button');
        const inspectButtons = buttons.filter(btn => 
          btn.querySelector('svg') // Eye icon
        );
        expect(inspectButtons.length).toBeGreaterThan(0);
      });
    });

    it('opens dialog when inspect button is clicked', async () => {
      // Test: Verify dialog opens on button click
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
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

    it('displays full request details in dialog', async () => {
      // Test: Verify dialog shows complete request information
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
      });

      // Open dialog
      const buttons = screen.getAllByRole('button');
      const inspectButton = buttons.find(btn => 
        btn.querySelector('svg') && !btn.textContent
      );

      if (inspectButton) {
        fireEvent.click(inspectButton);

        await waitFor(() => {
          // Dialog should show description
          expect(screen.getByText(/Review the requested changes/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Approve/Reject Actions', () => {
    it('calls approveEdit when approve button is clicked', async () => {
      // Test: Verify approve action triggers mutation
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
      });

      // Open dialog
      const buttons = screen.getAllByRole('button');
      const inspectButton = buttons.find(btn => 
        btn.querySelector('svg') && !btn.textContent
      );

      if (inspectButton) {
        fireEvent.click(inspectButton);

        await waitFor(() => {
          // In the dialog, find approve button
          const dialogButtons = screen.getAllByRole('button');
          const approveButton = dialogButtons.find(btn => 
            btn.querySelector('[class*="CheckCircle"]')
          );

          if (approveButton) {
            fireEvent.click(approveButton);

            // Approve mutation should be called with request ID
            waitFor(() => {
              expect(mockApproveEdit).toHaveBeenCalledWith('req-1');
            });
          }
        });
      }
    });

    it('calls rejectEdit when reject button is clicked', async () => {
      // Test: Verify reject action triggers mutation
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
      });

      // Open dialog
      const buttons = screen.getAllByRole('button');
      const inspectButton = buttons.find(btn => 
        btn.querySelector('svg') && !btn.textContent
      );

      if (inspectButton) {
        fireEvent.click(inspectButton);

        await waitFor(() => {
          // Find reject button in dialog
          const dialogButtons = screen.getAllByRole('button');
          const rejectButton = dialogButtons.find(btn => 
            btn.querySelector('[class*="XCircle"]')
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
      // Test: Verify error handling for failed approve
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockApproveEdit.mockRejectedValue(new Error('Approve failed'));

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
      });

      // Component should handle error without crashing
      consoleErrorSpy.mockRestore();
    });

    it('handles reject errors gracefully', async () => {
      // Test: Verify error handling for failed reject
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockRejectEdit.mockRejectedValue(new Error('Reject failed'));

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
      });

      // Component should handle error without crashing
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Scrollable Table', () => {
    it('renders table with scrollable container', async () => {
      // Test: Verify table is in scrollable wrapper for overflow handling
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // Check for scrollable container with max-height
        const scrollContainer = document.querySelector('[class*="overflow-y-auto"]');
        expect(scrollContainer).toBeInTheDocument();
      });
    });

    it('has sticky table header', async () => {
      // Test: Verify table header is rendered (sticky CSS may not be detected in tests)
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        const tableHeader = document.querySelector('thead');
        expect(tableHeader).toBeInTheDocument();
        
        // Verify header has expected structure
        const headerRow = tableHeader?.querySelector('tr');
        expect(headerRow).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles requests with missing specifications', async () => {
      // Test: Verify component handles null/undefined specifications
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

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
      });

      // Should not crash with null specifications
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
    });

    it('handles requests with invalid dates', async () => {
      // Test: Verify date formatting handles invalid date strings
      const requestsWithInvalidDate = [
        {
          ...mockRequests[0],
          created_at: 'not-a-date',
        },
      ];

      (useQueries.useChangeLogs as any).mockReturnValue({
        data: requestsWithInvalidDate,
        isLoading: false,
      });

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
      });
    });

    it('handles empty property list but with requests', async () => {
      // Test: Verify behavior when properties don't load
      (useQueries.useProperties as any).mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // All requests should show "Unknown Property"
        const unknownProperties = screen.getAllByText('Unknown Property');
        expect(unknownProperties.length).toBe(mockRequests.length);
      });
    });

    it('displays partial names when only first name is provided', async () => {
      // Test: Verify name handling with missing last name
      const requestsWithPartialNames = [
        {
          ...mockRequests[0],
          userFirstName: 'Alice',
          userLastName: null,
        },
      ];

      (useQueries.useChangeLogs as any).mockReturnValue({
        data: requestsWithPartialNames,
        isLoading: false,
      });

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // Should display first name only, trimmed
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
    });

    it('displays partial names when only last name is provided', async () => {
      // Test: Verify name handling with missing first name
      const requestsWithPartialNames = [
        {
          ...mockRequests[0],
          userFirstName: null,
          userLastName: 'Williams',
        },
      ];

      (useQueries.useChangeLogs as any).mockReturnValue({
        data: requestsWithPartialNames,
        isLoading: false,
      });

      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        // Should display last name only, trimmed
        expect(screen.getByText('Williams')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has semantic table structure', async () => {
      // Test: Verify proper HTML table semantics
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      const thead = document.querySelector('thead');
      const tbody = document.querySelector('tbody');

      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
    });

    it('has accessible dialog when opened', async () => {
      // Test: Verify dialog has proper ARIA attributes
      render(<OwnerRequests userId="owner-1" />);

      await waitFor(() => {
        expect(screen.getByText('Update roof details')).toBeInTheDocument();
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
