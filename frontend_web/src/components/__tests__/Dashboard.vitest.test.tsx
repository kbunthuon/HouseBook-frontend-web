import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

// Mock the backend FetchData module that the component imports
vi.mock('../../../../backend/FetchData', () => ({
  getAdminProperty: vi.fn(),
  getChangeLogs: vi.fn(),
  getAllOwners: vi.fn(),
}));

import * as FetchData from '../../../../backend/FetchData';

describe('Dashboard (vitest)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when there are no properties', async () => {
    (FetchData.getAdminProperty as any).mockResolvedValue([]);
    (FetchData.getChangeLogs as any).mockResolvedValue([]);
    (FetchData.getAllOwners as any).mockResolvedValue([]);

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

    (FetchData.getAdminProperty as any).mockResolvedValue([property]);
    (FetchData.getChangeLogs as any).mockResolvedValue([change]);
    (FetchData.getAllOwners as any).mockResolvedValue([]);

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
