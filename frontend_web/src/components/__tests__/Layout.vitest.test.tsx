import { render, screen } from '../../test-utils';
import { vi } from 'vitest';
import { Layout } from '../Layout';
import { BrowserRouter } from 'react-router-dom';

describe('Layout', () => {
  const mockOnLogout = vi.fn();
  const mockOnPageChange = vi.fn();

  it('renders the layout with sidebar', () => {
    render(
      <BrowserRouter>
        <Layout
          currentPage="dashboard"
          onPageChange={mockOnPageChange}
          onLogout={mockOnLogout}
        >
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('HouseBook')).toBeInTheDocument();
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <BrowserRouter>
        <Layout
          currentPage="dashboard"
          onPageChange={mockOnPageChange}
          onLogout={mockOnLogout}
        >
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays navigation menu items', () => {
    render(
      <BrowserRouter>
        <Layout
          currentPage="dashboard"
          onPageChange={mockOnPageChange}
          onLogout={mockOnLogout}
        >
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(
      <BrowserRouter>
        <Layout
          currentPage="dashboard"
          onPageChange={mockOnPageChange}
          onLogout={mockOnLogout}
        >
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
