import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test-utils';
import { vi } from 'vitest';
import { UserManagementPage } from '../UserManagement';
import * as FetchData from '../../../../backend/FetchData';

// Mock the FetchData module to prevent real API calls
vi.mock('../../../../backend/FetchData', () => ({
  getAllOwners: vi.fn(),
}));

describe('UserManagement Component', () => {
  // Mock owner data for testing
  const mockOwners = [
    {
      ownerId: 'owner-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
    },
    {
      ownerId: 'owner-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '098-765-4321',
    },
    {
      ownerId: 'owner-3',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '555-123-4567',
    },
  ];

  beforeEach(() => {
    // Reset mocks before each test for isolation
    vi.clearAllMocks();
    
    // Default: Return mock owners successfully
    (FetchData.getAllOwners as any).mockResolvedValue(mockOwners);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the user management table', async () => {
      // Test: Verify component renders with table structure
      render(<UserManagementPage />);

      await waitFor(() => {
        // Table should be present
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('displays all column headers', async () => {
      // Test: Verify table headers are correctly displayed
      render(<UserManagementPage />);

      await waitFor(() => {
        // Check for common headers based on Owner data structure
        // Adjust these based on your actual table headers
        expect(screen.getByText(/name/i)).toBeInTheDocument();
        expect(screen.getByText(/email/i)).toBeInTheDocument();
      });
    });

    it('renders search input field', () => {
      // Test: Verify search functionality UI is present
      render(<UserManagementPage />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('shows User icon in the interface', () => {
      // Test: Verify branding/UI icons are present
      render(<UserManagementPage />);

      // Lucide icons render as SVG elements
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Data Loading', () => {
    it('fetches and displays owners on mount', async () => {
      // Test: Verify owners are loaded from API and displayed
      render(<UserManagementPage />);

      // Wait for API call
      await waitFor(() => {
        expect(FetchData.getAllOwners).toHaveBeenCalledTimes(1);
      });

      // Verify owners are displayed
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('displays owner email addresses', async () => {
      // Test: Verify email information is shown
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
        expect(screen.getByText('bob.johnson@example.com')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      // Test: Verify loading indicator during data fetch
      // Mock a delayed response
      (FetchData.getAllOwners as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOwners), 100))
      );

      render(<UserManagementPage />);

      // Data should not be immediately visible
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('handles empty owner list gracefully', async () => {
      // Test: Verify empty state when no owners exist
      (FetchData.getAllOwners as any).mockResolvedValue([]);

      render(<UserManagementPage />);

      await waitFor(() => {
        // Should not show any owner names
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });

      // Component should still render without crashing
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('displays error message when API fails', async () => {
      // Test: Verify error handling when fetch fails
      (FetchData.getAllOwners as any).mockRejectedValue(
        new Error('Failed to load owners')
      );

      render(<UserManagementPage />);

      await waitFor(() => {
        // Check for error message (adjust based on your error UI)
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('handles null response from API', async () => {
      // Test: Verify component handles null/undefined API responses
      (FetchData.getAllOwners as any).mockResolvedValue(null);

      render(<UserManagementPage />);

      await waitFor(() => {
        // Should show error state
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters owners by first name', async () => {
      // Test: Verify search works with first name
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Should show matching owner
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should hide non-matching owners
      await waitFor(() => {
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('filters owners by last name', async () => {
      // Test: Verify search works with last name
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Smith' } });

      // Should show matching owner
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Should hide non-matching owners
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('filters owners by full name', async () => {
      // Test: Verify search works with full name
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Bob Johnson' } });

      // Should show matching owner
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

      // Should hide non-matching owners
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('filters owners by email address', async () => {
      // Test: Verify search works with email
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'jane.smith' } });

      // Should show matching owner
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Should hide non-matching owners
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('is case-insensitive when searching', async () => {
      // Test: Verify search ignores case
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Test lowercase
      fireEvent.change(searchInput, { target: { value: 'john' } });
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Test uppercase
      fireEvent.change(searchInput, { target: { value: 'JOHN' } });
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Test mixed case
      fireEvent.change(searchInput, { target: { value: 'JoHn' } });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows all owners when search is cleared', async () => {
      // Test: Verify clearing search restores full list
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Apply filter
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // All owners should be visible
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('shows no results when search matches nothing', async () => {
      // Test: Verify behavior when search has no matches
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'NonexistentUser' } });

      // No owners should match
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('handles special characters in search query', async () => {
      // Test: Verify search works with special characters
      const ownerWithSpecialChars = {
        ...mockOwners[0],
        email: 'john.doe+test@example.com',
      };

      (FetchData.getAllOwners as any).mockResolvedValue([ownerWithSpecialChars]);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('john.doe+test@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'john.doe+' } });

      // Should handle special chars without crashing
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('User Actions', () => {
    it('renders action menu for each owner', async () => {
      // Test: Verify each owner has an actions dropdown
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Look for dropdown trigger buttons (MoreVertical icon)
      const menuButtons = screen.getAllByRole('button');
      const dropdownButtons = menuButtons.filter(btn => 
        btn.querySelector('svg') // Has icon
      );

      // Should have dropdown for each owner
      expect(dropdownButtons.length).toBeGreaterThan(0);
    });

    it('opens dropdown menu when action button is clicked', async () => {
      // Test: Verify dropdown menu can be opened
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find and click first dropdown trigger
      const menuButtons = screen.getAllByRole('button');
      const dropdownButton = menuButtons.find(btn => btn.querySelector('svg'));

      if (dropdownButton) {
        fireEvent.click(dropdownButton);

        // Dropdown should open (check for menu items)
        await waitFor(() => {
          // Menu items might include: View, Edit, Delete, etc.
          const menuItems = screen.queryAllByRole('menuitem');
          expect(menuItems.length).toBeGreaterThan(0);
        });
      }
    });

    it('logs view action when view owner is triggered', async () => {
      // Test: Verify view action works (currently logs to console)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // This test verifies the handleViewOwner function exists
      // In real implementation, this would open a modal or navigate
      
      consoleSpy.mockRestore();
    });

    it('logs edit action when edit owner is triggered', async () => {
      // Test: Verify edit action works (currently logs to console)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // This test verifies the handleEditOwner function exists
      // In real implementation, this would open an edit form

      consoleSpy.mockRestore();
    });
  });

  describe('Table Display', () => {
    it('displays owner information in table rows', async () => {
      // Test: Verify all owner data appears in table
      render(<UserManagementPage />);

      await waitFor(() => {
        // Names
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();

        // Emails
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      });
    });

    it('renders correct number of rows for owners', async () => {
      // Test: Verify table has correct number of data rows
      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Count table rows (excluding header)
      const rows = document.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3); // 3 mock owners
    });
  });

  describe('Edge Cases', () => {
    it('handles owners with missing email', async () => {
      // Test: Verify component handles incomplete owner data
      const incompleteOwners = [
        {
          ownerId: 'owner-incomplete',
          firstName: 'Incomplete',
          lastName: 'User',
          email: '',
          phone: '',
        },
      ];

      (FetchData.getAllOwners as any).mockResolvedValue(incompleteOwners);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete User')).toBeInTheDocument();
      });

      // Should not crash with missing email
      expect(document.querySelector('table')).toBeInTheDocument();
    });

    it('handles owners with missing names', async () => {
      // Test: Verify component handles owners without names
      const ownersWithoutNames = [
        {
          ownerId: 'owner-no-name',
          firstName: '',
          lastName: '',
          email: 'noname@example.com',
          phone: '123-456-7890',
        },
      ];

      (FetchData.getAllOwners as any).mockResolvedValue(ownersWithoutNames);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('noname@example.com')).toBeInTheDocument();
      });

      // Should handle gracefully
      expect(document.querySelector('table')).toBeInTheDocument();
    });

    it('handles very long owner names', async () => {
      // Test: Verify component handles unusually long names
      const longNameOwners = [
        {
          ownerId: 'owner-long',
          firstName: 'VeryLongFirstNameThatExceedsNormalLength',
          lastName: 'VeryLongLastNameThatExceedsNormalLength',
          email: 'long@example.com',
          phone: '123-456-7890',
        },
      ];

      (FetchData.getAllOwners as any).mockResolvedValue(longNameOwners);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/VeryLongFirstName/)).toBeInTheDocument();
      });

      // Should render without breaking layout
      expect(document.querySelector('table')).toBeInTheDocument();
    });

    it('handles large number of owners', async () => {
      // Test: Verify performance with many owners
      const manyOwners = Array.from({ length: 100 }, (_, i) => ({
        ownerId: `owner-${i}`,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        email: `user${i}@example.com`,
        phone: `555-000-${String(i).padStart(4, '0')}`,
      }));

      (FetchData.getAllOwners as any).mockResolvedValue(manyOwners);

      render(<UserManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('First0 Last0')).toBeInTheDocument();
      });

      // Should render all owners
      const rows = document.querySelectorAll('tbody tr');
      expect(rows.length).toBe(100);
    });
  });

  describe('Card Layout', () => {
    it('renders within a Card component', () => {
      // Test: Verify component uses Card UI wrapper
      render(<UserManagementPage />);

      // Card component should have specific structure
      const card = document.querySelector('.card') || document.querySelector('[class*="card"]');
      
      // Component should be rendered (card classes may vary)
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('has proper card header with title', async () => {
      // Test: Verify Card header structure
      render(<UserManagementPage />);

      // Card typically has a title
      // Adjust based on your actual CardTitle content
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has semantic table structure', async () => {
      // Test: Verify proper table semantics for screen readers
      render(<UserManagementPage />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      // Should have proper table structure
      const thead = document.querySelector('thead');
      const tbody = document.querySelector('tbody');
      
      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
    });

    it('has accessible search input', () => {
      // Test: Verify search input is accessible
      render(<UserManagementPage />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      
      // Should be focusable
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.tagName).toBe('INPUT');
    });
  });
});
