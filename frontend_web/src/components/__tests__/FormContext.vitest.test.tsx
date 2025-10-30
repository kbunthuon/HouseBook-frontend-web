import { render, screen } from '../../test-utils';
import { vi } from 'vitest';
import { FormProvider, AdminFormProvider, useFormContext, useAdminFormContext } from '../FormContext';

function TestComponentWithFormContext() {
  const { formData, currentStep } = useFormContext();
  return (
    <div>
      <div>Property Name: {formData.propertyName}</div>
      <div>Current Step: {currentStep}</div>
    </div>
  );
}

function TestComponentWithAdminFormContext() {
  const { formData, owner, currentStep } = useAdminFormContext();
  return (
    <div>
      <div>Property Name: {formData.propertyName}</div>
      <div>Owner Email: {owner.email}</div>
      <div>Current Step: {currentStep}</div>
    </div>
  );
}

describe('FormContext', () => {
  it('provides form data through FormProvider', () => {
    render(
      <FormProvider>
        <TestComponentWithFormContext />
      </FormProvider>
    );

    expect(screen.getByText(/current step: 1/i)).toBeInTheDocument();
  });

  it('provides admin form data through AdminFormProvider', () => {
    render(
      <AdminFormProvider>
        <TestComponentWithAdminFormContext />
      </AdminFormProvider>
    );

    expect(screen.getByText(/current step: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/owner email:/i)).toBeInTheDocument();
  });
});
