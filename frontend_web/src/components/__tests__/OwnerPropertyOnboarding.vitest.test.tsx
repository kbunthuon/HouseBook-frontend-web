import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { OwnerPropertyOnboarding } from '@features/owner/pages/OwnerPropertyOnboarding';
import { FormProvider } from '@app/providers/FormContext';
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
  onboardProperty: vi.fn(() => Promise.resolve('property-123'))
}));

describe('OwnerPropertyOnboarding', () => {
  it('renders the onboarding form', async () => {
    render(
      <BrowserRouter>
        <FormProvider>
          <OwnerPropertyOnboarding userId="user-123" />
        </FormProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/property onboarding/i)).toBeInTheDocument();
    });
  });

  it('displays step progress', async () => {
    render(
      <BrowserRouter>
        <FormProvider>
          <OwnerPropertyOnboarding userId="user-123" />
        </FormProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    });
  });

  it('shows general information form in step 1', async () => {
    render(
      <BrowserRouter>
        <FormProvider>
          <OwnerPropertyOnboarding userId="user-123" />
        </FormProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/property name/i)).toBeInTheDocument();
    });
  });
});
