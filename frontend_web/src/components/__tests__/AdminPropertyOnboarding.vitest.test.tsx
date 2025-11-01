import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { AdminPropertyOnboarding } from '../AdminPropertyOnboarding';
import { AdminFormProvider } from '../FormContext';
import { BrowserRouter } from 'react-router-dom';

// Mock backend services
vi.mock('../../../../backend/FetchSpaceEnum', () => ({
  fetchSpaceEnum: vi.fn(() => Promise.resolve(['Bedroom', 'Kitchen', 'Bathroom']))
}));

vi.mock('../../../../backend/FetchAssetTypes', () => ({
  fetchAssetTypes: vi.fn(() => Promise.resolve([
    { id: '1', name: 'Door' },
    { id: '2', name: 'Window' }
  ])),
  fetchAssetTypesGroupedByDiscipline: vi.fn(() => Promise.resolve({}))
}));

vi.mock('../../../../backend/OnboardPropertyService', () => ({
  adminOnboardProperty: vi.fn(() => Promise.resolve('property-123'))
}));

vi.mock('@shared/api/wrappers', () => ({
  apiClient: {
    checkOwnerExists: vi.fn(() => Promise.resolve(true))
  }
}));

describe('AdminPropertyOnboarding', () => {
  it('renders the onboarding form', async () => {
    render(
      <BrowserRouter>
        <AdminFormProvider>
          <AdminPropertyOnboarding />
        </AdminFormProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/property onboarding/i)).toBeInTheDocument();
    });
  });

  it('displays step progress', async () => {
    render(
      <BrowserRouter>
        <AdminFormProvider>
          <AdminPropertyOnboarding />
        </AdminFormProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    });
  });

  it('shows owner details form in step 1', async () => {
    render(
      <BrowserRouter>
        <AdminFormProvider>
          <AdminPropertyOnboarding />
        </AdminFormProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/owner first name/i)).toBeInTheDocument();
    });
  });
});
