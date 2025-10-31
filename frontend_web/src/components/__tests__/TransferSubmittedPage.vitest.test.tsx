import { render, screen } from '../../test-utils';
import { vi } from 'vitest';
import TransferSubmittedPage from '../TransferSubmittedPage';
import { BrowserRouter } from 'react-router-dom';

describe('TransferSubmittedPage', () => {
  it('renders the submitted page', () => {
    render(
      <BrowserRouter>
        <TransferSubmittedPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/transfer request submitted/i)).toBeInTheDocument();
  });

  it('displays success message', () => {
    render(
      <BrowserRouter>
        <TransferSubmittedPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/successfully/i)).toBeInTheDocument();
  });

  it('shows navigation link', () => {
    render(
      <BrowserRouter>
        <TransferSubmittedPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument();
  });
});
