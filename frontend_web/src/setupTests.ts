import '@testing-library/jest-dom';

// Mock window.navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

// Mock QRCodeCanvas component since it might have issues in test environment
jest.mock('qrcode.react', () => ({
  QRCodeCanvas: jest.fn(({ value, ...props }: any) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': 'qr-code',
      'data-value': value,
      ...props
    }, 'QR Code Mock');
  }),
}));

// Mock the backend services
jest.mock('../../backend/FetchData', () => ({
  getPropertyDetails: jest.fn(),
  getPropertyOwners: jest.fn(),
}));

jest.mock('../../backend/JobService', () => ({
  fetchJobsInfo: jest.fn(),
  deleteJob: jest.fn(),
  JobStatus: {
    ACCEPTED: 'ACCEPTED',
    REVOKED: 'REVOKED',
    PENDING: 'PENDING',
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));