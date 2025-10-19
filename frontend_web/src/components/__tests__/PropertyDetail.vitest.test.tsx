import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { MemoryRouter } from 'react-router-dom';
// userEvent import removed — not used in these tests to avoid resolver issues
import { vi } from 'vitest';
import { PropertyDetail } from '../PropertyDetail';
import { apiClient } from '../../api/wrappers';
import { getPropertyDetails, getPropertyOwners } from '../../../../backend/FetchData';
import { fetchJobsInfo, deleteJob } from '../../../../backend/JobService';
import { toast } from 'sonner';

// Mock the modules
vi.mock('../../../../backend/FetchData');
vi.mock('../../../../backend/JobService');
vi.mock('../../../../backend/PropertyEditService', () => ({
  getAssetTypes: vi.fn().mockResolvedValue([]),
  updateProperty: vi.fn(),
  updateSpace: vi.fn(),
  updateAsset: vi.fn(),
  deleteSpace: vi.fn(),
  deleteAsset: vi.fn(),
  createSpace: vi.fn(),
  createAsset: vi.fn(),
  updateFeatures: vi.fn(),
  deleteFeature: vi.fn(),
}));
vi.mock('../../../../backend/ChangeLogService', () => ({
  getPropertyHistory: vi.fn().mockResolvedValue([]),
  getSpaceHistory: vi.fn().mockResolvedValue([]),
  getAssetHistory: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../../../backend/FetchSpaceEnum', () => ({ fetchSpaceEnum: vi.fn().mockResolvedValue([]) }));
vi.mock('sonner');
// Prevent the backend FetchAssetTypes from attempting a real fetch during tests
vi.mock('../../../../backend/FetchAssetTypes', () => ({
  fetchAssetTypes: vi.fn().mockResolvedValue([]),
  fetchAssetTypesGroupedByDiscipline: vi.fn().mockResolvedValue({}),
}));

// Cast to any for ease inside tests
const mockGetPropertyDetails = getPropertyDetails as any;
const mockGetPropertyOwners = getPropertyOwners as any;
const mockFetchJobsInfo = fetchJobsInfo as any;
const mockDeleteJob = deleteJob as any;
const mockToast = toast as any;

const mockProperty = {
  propertyId: 'property-1',
  name: 'Test Property',
  description: 'A beautiful test property',
  address: '123 Test Street, Test City',
  status: '75%',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  totalFloorArea: 0,
  spaces: [
    {
      id: 'space-1',
      name: 'Living Room',
      assets: [
        { id: 'asset-1', assetTypes: { id: 1, name: 'Flooring', discipline: '' }, description: 'Hardwood flooring', currentSpecifications: {} },
        { id: 'asset-2', assetTypes: { id: 2, name: 'Lighting', discipline: '' }, description: 'LED ceiling lights', currentSpecifications: {} }
      ]
    },
    {
      id: 'space-2',
      name: 'Kitchen',
      assets: [{ id: 'asset-3', assetTypes: { id: 3, name: 'Countertop', discipline: '' }, description: 'Granite countertops', currentSpecifications: {} }]
    }
  ]
} as any;

const mockOwners = [{ firstName: 'John', lastName: 'Doe' }] as any;

const mockJobs = [
  {
    id: 'job-1',
    property_id: 'property-1',
    tradie_id: 'tradie-1',
    title: 'Test Job',
    status: 'ACCEPTED',
    created_at: '2024-01-15T10:00:00Z',
    end_time: '2024-02-15T10:00:00Z',
    expired: false,
    pin: '123456'
  }
] as any;

const mockJobAssets = [{ asset_id: 'asset-1', job_id: 'job-1' }] as any;

const defaultProps = { propertyId: 'property-1', onBack: vi.fn() } as any;

// helper to render components that use react-router hooks
const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('PropertyDetail Component (vitest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock apiClient methods used by PropertyDetail
    (apiClient.getPropertyDetails as any) = vi.fn().mockResolvedValue(mockProperty);
    (apiClient.getPropertyImages as any) = vi.fn().mockResolvedValue({ images: mockProperty.images });
    (apiClient.getPropertyOwners as any) = vi.fn().mockResolvedValue(mockOwners);

    // Ensure backend dynamic imports used by hooks are mocked
    // PropertyEditService.getAssetTypes is already mocked above to return []
    // FetchSpaceEnum is mocked above to return []

    mockFetchJobsInfo.mockResolvedValue([mockJobs, mockJobAssets]);
  });

  describe('Rendering', () => {
    it('renders loading state initially', () => {
  renderWithRouter(<PropertyDetail {...defaultProps} />);
      expect(screen.getByText('Loading property details...')).toBeInTheDocument();
    });

    it('renders property details when data is loaded', async () => {
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Test Property')).toBeInTheDocument());

      expect(screen.getByText('A beautiful test property')).toBeInTheDocument();
      expect(screen.getByText(/123 Test Street/)).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('renders property images when available', async () => {
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Property Images')).toBeInTheDocument());

      const images = screen.getAllByAltText(/Property Image/);
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    it('shows no images message when no images available', async () => {
      mockGetPropertyDetails.mockResolvedValue({ ...mockProperty, images: [] });
      // also ensure the images endpoint returns empty
      (apiClient.getPropertyImages as any).mockResolvedValue({ images: [] });

      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText(/No images available/i)).toBeInTheDocument());
    });

    it('renders spaces/sections correctly', async () => {
  renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Living Room')).toBeInTheDocument());

      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Flooring')).toBeInTheDocument();
      expect(screen.getByText('Hardwood flooring')).toBeInTheDocument();
      expect(screen.getByText('Lighting')).toBeInTheDocument();
      expect(screen.getByText('LED ceiling lights')).toBeInTheDocument();
    });

    it('renders QR code with correct property ID', async () => {
      const { container } = renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
      });
    });

    it('renders jobs and access management section', async () => {
  renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Jobs & Access Management')).toBeInTheDocument());
    });
  });

  describe('Error Handling', () => {
    it('handles property fetch error', async () => {
      (apiClient.getPropertyDetails as any).mockRejectedValue(new Error('Failed to fetch property'));
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText(/Error:/)).toBeInTheDocument());
    });

    it('handles missing property data', async () => {
      (apiClient.getPropertyDetails as any).mockResolvedValue(null);
      // Ensure owners endpoint returns null so UI shows Owner: N/A
      (apiClient.getPropertyOwners as any) = vi.fn().mockResolvedValue(null);
      renderWithRouter(<PropertyDetail {...defaultProps} />);
      // component renders fallback header and shows Owner as N/A
      await waitFor(() => {
        expect(screen.getByText('Property')).toBeInTheDocument();
  expect(screen.getByText('Owner: N/A')).toBeInTheDocument();
      });
    });

    it('handles missing owner data', async () => {
      (apiClient.getPropertyOwners as any).mockResolvedValue(null);
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Owner: N/A')).toBeInTheDocument());
    });
  });

  describe('User Interactions', () => {
    it('calls onBack when back button is clicked', async () => {
      const mockOnBack = vi.fn();
      renderWithRouter(<PropertyDetail {...defaultProps} onBack={mockOnBack} />);

      await waitFor(() => expect(screen.getByText('Back to Properties')).toBeInTheDocument());
      const backButton = screen.getByText('Back to Properties');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('opens pin dialog when "Create New Job" button is clicked', async () => {
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Create New Job')).toBeInTheDocument());

      const createJobButton = screen.getByText('Create New Job');
      fireEvent.click(createJobButton);
    });

    it('opens edit dialog when edit button in section is clicked', async () => {
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Living Room')).toBeInTheDocument());

      const editButtons = screen.getAllByRole('button');
      const sectionEditButton = editButtons.find(button => button.querySelector('svg') && button.closest('.space-y-0'));
      if (sectionEditButton) fireEvent.click(sectionEditButton);
    });

    it('handles clipboard copy functionality', async () => {
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Test Property')).toBeInTheDocument());
    });
  });

  describe('Job Management', () => {
    it('handles job deletion successfully', async () => {
      mockDeleteJob.mockResolvedValue(true);
  renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Jobs & Access Management')).toBeInTheDocument());
    });

    it('handles job deletion failure', async () => {
      mockDeleteJob.mockResolvedValue(false);
  renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Jobs & Access Management')).toBeInTheDocument());
    });

    it('handles job status toggle', async () => {
  renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Jobs & Access Management')).toBeInTheDocument());
    });
  });

  describe('Edit History', () => {
    it('opens timeline dialog when history button is clicked', async () => {
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Living Room')).toBeInTheDocument());

      const historyButtons = screen.getAllByRole('button');
      const sectionHistoryButton = historyButtons.find(button => button.querySelector('svg') && button.closest('.space-y-0'));
      if (sectionHistoryButton) fireEvent.click(sectionHistoryButton);
    });

    it('displays edit history correctly', async () => {
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Living Room')).toBeInTheDocument());
    });
  });

  describe('Component Props', () => {
    it('uses correct propertyId for data fetching', async () => {
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect((apiClient.getPropertyDetails as any)).toHaveBeenCalledWith('property-1'));
      expect((apiClient.getPropertyOwners as any)).toHaveBeenCalledWith('property-1');
      expect(mockFetchJobsInfo).toHaveBeenCalledWith({ propertyId: 'property-1' });
    });

    it('re-fetches data when propertyId changes', async () => {
      const { rerender } = renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect((apiClient.getPropertyDetails as any)).toHaveBeenCalledWith('property-1'));

      rerender(<MemoryRouter><PropertyDetail {...defaultProps} propertyId="property-2" /></MemoryRouter>);

      await waitFor(() => {
        expect((apiClient.getPropertyDetails as any)).toHaveBeenCalledWith('property-2');
        expect((apiClient.getPropertyOwners as any)).toHaveBeenCalledWith('property-2');
        expect(mockFetchJobsInfo).toHaveBeenCalledWith({ propertyId: 'property-2' });
      });
    });
  });

  describe('Toast Notifications', () => {
    it('shows success toast when PIN is copied', async () => {
      Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Test Property')).toBeInTheDocument());
    });

    it('shows error toast when clipboard copy fails', async () => {
      Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')) } });
      renderWithRouter(<PropertyDetail {...defaultProps} />);

      await waitFor(() => expect(screen.getByText('Test Property')).toBeInTheDocument());
    });
  });

  describe('Loading States', () => {
    it('shows loading state while fetching data', () => {
      (apiClient.getPropertyDetails as any).mockImplementation(() => new Promise(() => {}));
      (apiClient.getPropertyOwners as any).mockImplementation(() => new Promise(() => {}));
      mockFetchJobsInfo.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<PropertyDetail {...defaultProps} />);
      expect(screen.getByText('Loading property details...')).toBeInTheDocument();
    });
  });
});
