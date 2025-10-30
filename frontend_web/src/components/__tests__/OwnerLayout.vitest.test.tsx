import { render, screen } from '../../test-utils';
import { vi } from 'vitest';
import { OwnerLayout } from '../OwnerLayout';
import { BrowserRouter } from 'react-router-dom';

describe('OwnerLayout', () => {
  const mockOnLogout = vi.fn();
  const mockOnPageChange = vi.fn();

  it('renders the owner layout with sidebar', () => {
    render(
      <BrowserRouter>
        <OwnerLayout
          currentPage="dashboard"
          onPageChange={mockOnPageChange}
          onLogout={mockOnLogout}
          ownerName="John Doe"
        >
          <div>Owner Content</div>
        </OwnerLayout>
      </BrowserRouter>
    );

    expect(screen.getByText('HouseBook')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <BrowserRouter>
        <OwnerLayout
          currentPage="dashboard"
          onPageChange={mockOnPageChange}
          onLogout={mockOnLogout}
          ownerName="John Doe"
        >
          <div>Owner Content</div>
        </OwnerLayout>
      </BrowserRouter>
    );

    expect(screen.getByText('Owner Content')).toBeInTheDocument();
  });

  it('displays logout button', () => {
    render(
      <BrowserRouter>
        <OwnerLayout
          currentPage="dashboard"
          onPageChange={mockOnPageChange}
          onLogout={mockOnLogout}
          ownerName="John Doe"
        >
          <div>Owner Content</div>
        </OwnerLayout>
      </BrowserRouter>
    );

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
