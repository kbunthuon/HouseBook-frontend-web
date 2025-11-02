import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { Dashboard } from '@features/admin/pages/Dashboard';
import { apiClient } from '@shared/api/wrappers';

// Ensure we can control apiClient calls used by the hooks
// (useAdminProperties uses apiClient.getAdminProperties)

describe('Dashboard (vitest)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when there are no properties', async () => {
  // apiClient methods used by hooks
  (apiClient.getAdminProperties as any) = vi.fn().mockResolvedValue([]);
  (apiClient.getChangeLogs as any) = vi.fn().mockResolvedValue([]);
  (apiClient.getAllOwners as any) = vi.fn().mockResolvedValue([]);

    render(<Dashboard userId="user-1" userType="ADMIN" />);

    await waitFor(() => expect(screen.getByText('No Properties Yet')).toBeInTheDocument());
  });

  it('renders properties and pending change requests', async () => {
    const property = {
      propertyId: 'prop-1',
      name: 'Test Property',
      address: '123 Test Ave',
      splashImage: null,
    } as any;

    const change = {
      id: 'chg-1',
      propertyId: 'prop-1',
      changeDescription: 'Update address',
      created_at: new Date().toISOString(),
      status: 'PENDING',
      specifications: { address: '456 New St' },
      user: [{ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }],
    } as any;

    (apiClient.getAdminProperties as any) = vi.fn().mockResolvedValue([property]);
    // Return API-shaped changelog objects (snake_case) since useChangeLogs expects that
    (apiClient.getChangeLogs as any) = vi.fn().mockResolvedValue([
      {
        changelog_id: 'chg-1',
        changelog_description: 'Update address',
        changelog_created_at: new Date().toISOString(),
        changelog_status: 'PENDING',
        changelog_specifications: { address: '456 New St' },
        property_id: 'prop-1',
        user_first_name: 'Jane',
        user_last_name: 'Doe',
        user_email: 'jane@example.com'
      }
    ]);
    (apiClient.getAllOwners as any) = vi.fn().mockResolvedValue([]);

    render(<Dashboard userId="user-1" userType="ADMIN" />);

    // Wait for property card
    await waitFor(() => expect(screen.getByText('Test Property')).toBeInTheDocument());

  // Open the Audit Log tab so the audit table is visible. Radix Tabs
  // sometimes react to pointerdown, so fire mouseDown before click.
  const auditTab = screen.getByText(/Audit Log/i);
  fireEvent.mouseDown(auditTab);
  auditTab.click();

  // Use findByText which waits for the element to appear
  await screen.findByText(/Update address/i);
  });
});
