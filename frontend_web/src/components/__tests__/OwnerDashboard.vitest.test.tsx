import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '../../test-utils';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { OwnerDashboard } from '../OwnerDashboard';
import { apiClient } from '@shared/api/wrappers';

// Mock backend modules and supabase
vi.mock('../../../../backend/FetchData');
vi.mock('../../../../config/supabaseClient.ts', () => ({
  default: {
    from: (_table: string) => ({
      update: (_payload: any) => ({
        eq: (_field: string, _val: any) => Promise.resolve({ data: {}, error: null })
      })
    })
  }
}));

// Casts
const mockGetChangeLogs = apiClient.getChangeLogs as any;

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('OwnerDashboard (vitest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure apiClient methods are mocked functions we can control
    (apiClient.getOwnerId as any) = vi.fn().mockResolvedValue('owner-1');
    (apiClient.getPropertyList as any) = vi.fn().mockResolvedValue([]);
    (apiClient.getChangeLogs as any) = vi.fn().mockResolvedValue([]);
  });

  it('shows no pending requests when none', async () => {
    renderWithRouter(<OwnerDashboard userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText(/No pending requests/i)).toBeInTheDocument();
    });
  });

  it('renders pending requests and opens details dialog', async () => {
    const mockProps = [{ propertyId: 'property-1', address: '123 Fake St' }];
    const mockChanges = [
      {
        id: 'change-1',
        propertyId: 'property-1',
        changeDescription: 'Change the roof color',
        status: 'PENDING',
        specifications: {},
        created_at: new Date().toISOString(),
        user: { first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com' }
      }
    ];

    (apiClient.getPropertyList as any).mockResolvedValue(mockProps);
    // mock change logs in API response shape (snake_case)
    (apiClient.getChangeLogs as any) = vi.fn().mockResolvedValue([
      {
        changelog_id: 'change-1',
        changelog_description: 'Change the roof color',
        changelog_created_at: new Date().toISOString(),
        changelog_status: 'PENDING',
        changelog_specifications: {},
        property_id: 'property-1',
        user_first_name: 'Alice',
        user_last_name: 'Smith',
        user_email: 'alice@example.com'
      }
    ]);

    renderWithRouter(<OwnerDashboard userId="user-1" />);

    // Wait for the change description to appear in the table
    await waitFor(() => expect(screen.getByText('Change the roof color')).toBeInTheDocument());

    // Open the view dialog (the Eye button)
    const eyeButton = screen.getAllByRole('button').find((b) => b.getAttribute('title') === null);
    // There are many buttons; find the one that has an accessible name via svg only. Fallback: click the first button in the row.
    if (eyeButton) fireEvent.click(eyeButton);

  // After opening, find the dialog and the Approve button inside it
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(within(dialog).getByRole('button', { name: /Approve/i })).toBeInTheDocument());

  // Ensure the Approve button exists (don't click it to avoid calling into supabase)
  const approve = within(dialog).getByRole('button', { name: /Approve/i });
  expect(approve).toBeInTheDocument();
  });
});
