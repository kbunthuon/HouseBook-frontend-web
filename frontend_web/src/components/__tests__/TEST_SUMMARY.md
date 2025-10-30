# Test Suite Documentation

This directory contains all component tests for the HouseBook Admin Portal frontend application.

## Running Tests

### Run All Tests
```bash
npm run test:vitest:run
```
Runs all tests once and displays results with a dot reporter.

### Run Tests in Watch Mode
```bash
npm run test:vitest
```
Runs tests in watch mode - tests automatically re-run when files change.

### Run Tests with UI
```bash
npm run test:vitest:ui
```
Opens an interactive UI in your browser to view and run tests.

## Test Coverage

### Current Coverage
- **22 test files** - all passing ✅
- **210 tests** - all passing ✅
- **100% component coverage** - all components have tests

### Covered Components
All components in `frontend_web/src/components/` have corresponding test files:
- AdminFunctions
- AdminPropertyOnboarding
- AdminRequests
- Auth
- Dashboard
- FormContext
- Layout
- MyProperties
- MyReports
- OldOwnerTransferDialog
- OwnerDashboard
- OwnerLayout
- OwnerPropertyOnboarding
- PinManagementDialog
- PinTable
- PropertyDetail
- PropertyManagement
- Reports
- TransferRequestPage
- TransferSubmittedPage
- UserManagement
- And more...

## Test File Naming Convention

All test files follow this pattern:
```
ComponentName.vitest.test.tsx
```

Example: `Dashboard.vitest.test.tsx`

## Test Structure

Tests use Vitest with React Testing Library:

```typescript
import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Test Utilities

### Custom Render Wrapper
Located at `frontend_web/src/test-utils.tsx`, provides:
- QueryClientProvider wrapper for React Query
- Automatic cleanup after each test
- Disabled retry logic for faster test failures

### Common Patterns

#### Mocking API Calls
```typescript
vi.mock('../../api/wrappers', () => ({
  apiClient: {
    getPropertyList: vi.fn(),
    getUserInfoByEmail: vi.fn()
  }
}));
```

#### Mocking Backend Services
```typescript
vi.mock('../../../../backend/JobService', () => ({
  fetchJobsInfo: vi.fn(() => Promise.resolve([[], []]))
}));
```

#### Router Wrapper
Components using `useNavigate()` need BrowserRouter:
```typescript
import { BrowserRouter } from 'react-router-dom';

render(
  <BrowserRouter>
    <YourComponent />
  </BrowserRouter>
);
```

#### Window.matchMedia Mock
For components using mobile detection:
```typescript
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## Configuration

### Vitest Config
Located at project root: `vitest.config.ts`
- Environment: jsdom
- Globals enabled
- Setup file: `frontend_web/src/setupTests.vitest.ts`

### TypeScript Config
Located at project root: `tsconfig.json`
- Includes vitest globals
- React JSX support

## Troubleshooting

### Common Issues

**Tests fail with "useNavigate must be used within Router"**
- Wrap component in `<BrowserRouter>`

**Tests fail with "matchMedia is not a function"**
- Add window.matchMedia mock (see patterns above)

**Mock hoisting errors**
- Use `vi.fn()` directly in `vi.mock()`, not variables
- Use `vi.mocked()` to access mocks in tests

**API client not mocked**
- Ensure all methods used by component are included in mock

## Best Practices

1. **Always use waitFor** for async operations
2. **Mock all external dependencies** (API calls, backend services)
3. **Test user interactions** with fireEvent or userEvent
4. **Check both happy path and error cases**
5. **Use descriptive test names** that explain what is being tested
6. **Clean up mocks** in beforeEach/afterEach hooks

## Adding New Tests

1. Create test file: `ComponentName.vitest.test.tsx`
2. Import component and test utilities
3. Mock all external dependencies
4. Write descriptive test cases
5. Run tests to verify: `npm run test:vitest:run`
6. Ensure all tests pass before committing

## Continuous Integration

All tests must pass before merging to main branch. The test suite runs automatically on:
- Pull requests
- Push to main/development branches

---

**Last Updated**: October 31, 2025  
**Test Framework**: Vitest v1.6.1  
**Testing Library**: @testing-library/react v16.3.0
