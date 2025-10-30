import { render, screen, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { PinManagementDialog } from '../PinManagementDialog';
import { BrowserRouter } from 'react-router-dom';

// Mock backend services
vi.mock('../../../../backend/FetchAssetTypes', () => ({
  fetchAssetTypesGroupedByDiscipline: vi.fn(() => Promise.resolve({
    'Plumbing': ['Sink', 'Toilet'],
    'Electrical': ['Light', 'Socket']
  }))
}));

vi.mock('../../../../backend/JobService', () => ({
  insertJobsInfo: vi.fn(() => Promise.resolve([{ id: 'job-1', title: 'Test Job', pin: '1234' }, []])),
  updateJobInfo: vi.fn(() => Promise.resolve([{ id: 'job-1', title: 'Updated Job', pin: '1234' }, []])),
  fetchJobAssets: vi.fn(() => Promise.resolve([]))
}));

describe('PinManagementDialog', () => {
  const mockProperty = {
    id: 'prop-1',
    name: 'Test Property',
    spaces: [
      {
        id: 'space-1',
        name: 'Living Room',
        assets: [
          { id: 'asset-1', assetId: 'asset-1', type: 'Door' }
        ]
      }
    ]
  };

  it('renders create dialog when no job provided', async () => {
    render(
      <BrowserRouter>
        <PinManagementDialog
          open={true}
          onOpenChange={vi.fn()}
          onSave={vi.fn()}
          propertyId="prop-1"
          property={mockProperty as any}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/create a new job/i)).toBeInTheDocument();
    });
  });

  it('renders edit dialog when job provided', async () => {
    const mockJob = {
      id: 'job-1',
      title: 'Test Job',
      propertyId: 'prop-1',
      createdAt: '2024-01-01',
      endTime: null,
      expired: false,
      pin: '1234'
    };

    render(
      <BrowserRouter>
        <PinManagementDialog
          open={true}
          onOpenChange={vi.fn()}
          onSave={vi.fn()}
          propertyId="prop-1"
          property={mockProperty as any}
          job={mockJob}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/edit job/i)).toBeInTheDocument();
    });
  });

  it('displays job title input', async () => {
    render(
      <BrowserRouter>
        <PinManagementDialog
          open={true}
          onOpenChange={vi.fn()}
          onSave={vi.fn()}
          propertyId="prop-1"
          property={mockProperty as any}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/job title/i)).toBeInTheDocument();
    });
  });

  it('shows discipline selection checkboxes', async () => {
    render(
      <BrowserRouter>
        <PinManagementDialog
          open={true}
          onOpenChange={vi.fn()}
          onSave={vi.fn()}
          propertyId="prop-1"
          property={mockProperty as any}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/select disciplines for this pin/i)).toBeInTheDocument();
    });
  });
});
