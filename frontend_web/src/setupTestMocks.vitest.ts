import { vi } from 'vitest';

// Seed sessionStorage to avoid token refresh behavior in ApiClient during tests
try {
  const ACCESS_KEY = 'housebook_access_token';
  const EXPIRES_KEY = 'housebook_expires_at';
  if (!sessionStorage.getItem(ACCESS_KEY)) sessionStorage.setItem(ACCESS_KEY, 'test-access-token');
  if (!sessionStorage.getItem(EXPIRES_KEY)) {
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
    sessionStorage.setItem(EXPIRES_KEY, String(expiresAt));
  }
} catch (e) {
  // ignore
}

const defaultMockProperties = [
  {
    propertyId: 'prop-1',
    name: 'Sunset Villa',
    address: '123 Ocean Drive',
    status: 'Active',
    completionStatus: 85,
    type: 'House',
    lastUpdated: new Date('2024-01-15').toISOString(),
  },
  {
    propertyId: 'prop-2',
    name: 'Mountain Retreat',
    address: '456 Hill Street',
    status: 'Pending',
    completionStatus: 60,
    type: 'Condo',
    lastUpdated: new Date('2024-02-20').toISOString(),
  },
  {
    propertyId: 'prop-3',
    name: 'Downtown Loft',
    address: '789 Main Avenue',
    status: 'Transfer',
    completionStatus: 95,
    type: 'Apartment',
    lastUpdated: new Date('2024-03-10').toISOString(),
  },
];

vi.mock('@shared/api/wrappers', () => {
  const noop = () => undefined;
  return {
    apiClient: {
      getAdminProperties: vi.fn().mockResolvedValue(defaultMockProperties),
      getPropertyList: vi.fn().mockResolvedValue(defaultMockProperties),
      getPropertyOwners: vi.fn().mockResolvedValue([]),
      getPropertyDetails: vi.fn().mockResolvedValue(defaultMockProperties[0]),
      getAdminPropertiesByUser: vi.fn().mockResolvedValue(defaultMockProperties),
      getAllOwners: vi.fn().mockResolvedValue([]),
      getTransfersByProperty: vi.fn().mockResolvedValue([]),
      getTransfersByUser: vi.fn().mockResolvedValue([]),
      initiateTransfer: vi.fn().mockResolvedValue({}),
      approveTransfer: vi.fn().mockResolvedValue({}),
      rejectTransfer: vi.fn().mockResolvedValue({}),
      getChangeLogs: vi.fn().mockResolvedValue([]),
      getPropertyImages: vi.fn().mockResolvedValue([]),
      uploadPropertyImage: vi.fn().mockResolvedValue({}),
      deletePropertyImages: vi.fn().mockResolvedValue({}),
      updatePropertySplashImage: vi.fn().mockResolvedValue({}),
      signup: vi.fn().mockResolvedValue({}),
      login: vi.fn().mockResolvedValue({}),
      logout: vi.fn().mockResolvedValue(true),
      verifyAuth: vi.fn().mockResolvedValue({}),
    },
    TokenManager: {
      getAccessToken: () => 'test-access-token',
      getExpiresAt: () => Math.floor(Date.now() / 1000) + 3600,
      isTokenExpired: () => false,
      setTokens: noop,
      clearTokens: noop,
    },
  };
});
