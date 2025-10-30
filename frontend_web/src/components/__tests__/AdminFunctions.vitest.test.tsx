import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-utils';
import { AdminFunctions } from '../AdminFunctions';

describe('AdminFunctions', () => {
  it('renders main sections and key controls', () => {
    render(<AdminFunctions />);

    // Basic headings
    expect(screen.getByText(/Admin Functions/i)).toBeTruthy();
    expect(screen.getByText(/Initiate Property Transfer/i)).toBeTruthy();
    expect(screen.getByText(/Pending Transfer Requests/i)).toBeTruthy();
    
    // Check for tab labels
    expect(screen.getByText(/Property Transfers/i)).toBeTruthy();
    expect(screen.getByText(/Audit Log/i)).toBeTruthy();

    // Form controls and submit button should be present
    // Select components sometimes render custom content; check for button label and submit control
    expect(screen.getByRole('button', { name: /Submit Transfer Request/i })).toBeTruthy();
  });
});
