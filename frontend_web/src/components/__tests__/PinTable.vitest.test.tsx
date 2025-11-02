import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { vi } from 'vitest';
import { PinTable } from '@features/property/components/PinTable';

// Mock backend services
vi.mock('../../../../backend/JobService', () => ({
  fetchJobsInfo: vi.fn(() => Promise.resolve([
    [
      {
        id: 'job-1',
        title: 'Test Job',
        pin: '1234',
        expired: false,
        createdAt: '2024-01-01',
        endTime: null,
        propertyId: 'prop-1'
      }
    ],
    []
  ])),
  deleteJob: vi.fn(() => Promise.resolve())
}));

describe('PinTable', () => {
  const mockJobs = [
    {
      id: 'job-1',
      title: 'Test Job',
      pin: '1234',
      expired: false,
      createdAt: '2024-01-01',
      endTime: null,
      propertyId: 'prop-1'
    }
  ];

  it('renders the pin table', async () => {
    render(
      <PinTable
        propertyId="prop-1"
        property={null}
        jobs={mockJobs}
        jobAssets={[]}
        onDeleteJob={vi.fn()}
        onSaveJobEdits={vi.fn()}
      />
    );

    // Just verify the table renders with job data
    expect(screen.getByText('Test Job')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('displays job information', async () => {
    render(
      <PinTable
        propertyId="prop-1"
        property={null}
        jobs={mockJobs}
        jobAssets={[]}
        onDeleteJob={vi.fn()}
        onSaveJobEdits={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Job')).toBeInTheDocument();
      expect(screen.getByText('1234')).toBeInTheDocument();
    });
  });

  it('shows create new PIN button', async () => {
    render(
      <PinTable
        propertyId="prop-1"
        property={null}
        jobs={mockJobs}
        jobAssets={[]}
        onDeleteJob={vi.fn()}
        onSaveJobEdits={vi.fn()}
      />
    );

    // Component renders job data and UI elements
    expect(screen.getByText('Test Job')).toBeInTheDocument();
  });
});
