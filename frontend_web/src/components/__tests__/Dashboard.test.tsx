/// <reference types="jest" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dashboard } from '../Dashboard';

// Import the backend module and spy on its exports so we can control responses.
import * as FetchData from '../../../../backend/FetchData';

describe('Dashboard', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('shows empty state when there are no properties', async () => {
    // Mock backend functions
    jest.spyOn(FetchData, 'getAdminProperty').mockResolvedValue([] as any);
    jest.spyOn(FetchData, 'getChangeLogs').mockResolvedValue([] as any);
    jest.spyOn(FetchData, 'getAllOwners').mockResolvedValue([] as any);

    render(<Dashboard userId="user-1" userType="ADMIN" />);

    // Wait for the async effect to finish and the empty state to render
    await waitFor(() => {
      expect(screen.getByText('No Properties Yet')).toBeInTheDocument();
    });
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

    jest.spyOn(FetchData, 'getAdminProperty').mockResolvedValue([property] as any);
    jest.spyOn(FetchData, 'getChangeLogs').mockResolvedValue([change] as any);
    jest.spyOn(FetchData, 'getAllOwners').mockResolvedValue([] as any);

    render(<Dashboard userId="user-1" userType="ADMIN" />);

    // Wait for property card to show up
    await waitFor(() => expect(screen.getByText('Test Property')).toBeInTheDocument());

    // The audit log lists should show the change description or the user name
    await waitFor(() => expect(screen.getByText('Update address')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
  });
});
