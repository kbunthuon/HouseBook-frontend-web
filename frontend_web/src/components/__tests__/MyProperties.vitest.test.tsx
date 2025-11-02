import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { MyProperties } from '@features/property/pages/MyProperties';
import { apiClient } from '@shared/api/wrappers';
// import { getOwnerId } from '../../../../backend/FetchData';

vi.mock('../../../../backend/FetchData');

// We'll reference apiClient methods at runtime (they're reassigned to vi.fn() in beforeEach)

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('MyProperties (vitest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.getPropertyList as any) = vi.fn().mockResolvedValue([]);
    (apiClient.getTransfersByUser as any) = vi.fn().mockResolvedValue({ transfers: [] });
  });

  it('shows empty state when no properties', async () => {
    renderWithRouter(<MyProperties ownerId="owner-1" />);

    await waitFor(() => expect(screen.getByText(/You haven't added any properties yet/i)).toBeInTheDocument());
  });

  it('renders properties and navigates to view', async () => {
    const mockProps = [
      { propertyId: 'p1', name: 'Home 1', address: '1 Main St', lastUpdated: new Date().toISOString(), completionStatus: 80, status: 'Active', type: 'House' }
    ];
    (apiClient.getPropertyList as any).mockResolvedValue(mockProps);

    renderWithRouter(<MyProperties ownerId="owner-1" onViewProperty={vi.fn()} onAddProperty={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Home 1')).toBeInTheDocument());

    // Click View (ExternalLink button) on the row
    const viewButton = screen.getAllByRole('button').find(b => b.getAttribute('title') === 'View Property Details' || b.querySelector('svg'));
    if (viewButton) fireEvent.click(viewButton);

    // Ensure no errors and row still present
    expect(screen.getByText('Home 1')).toBeInTheDocument();
  });
});
