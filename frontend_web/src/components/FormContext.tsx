// FormContext.tsx - Create this new file
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FormData, SpaceInt, OwnerData } from "../types/serverTypes";

interface FormContextType {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    spaces: SpaceInt[];
    setSpaces: React.Dispatch<React.SetStateAction<SpaceInt[]>>;
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    resetForm: () => void;
}

interface AdminFormContextType {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    spaces: SpaceInt[];
    setSpaces: React.Dispatch<React.SetStateAction<SpaceInt[]>>;
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    ownerData: OwnerData;
    setOwnerData: React.Dispatch<React.SetStateAction<OwnerData>>;
    resetForm: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);
const AdminFormContext = createContext<AdminFormContextType | undefined>(undefined);

const initialFormData: FormData = {
    propertyName: "",
    propertyDescription: "",
    address: "",
    floorPlans: [] as File[],
    buildingPlans: [] as File[]
};

const initialSpaces: SpaceInt[] = [
    {
    type: "",
    name: "",
    assets: [
        {
        typeId: "",
        name: "",
        description: "",
        features: [{ name: "", value: "" }]
        }
    ]
    }
];

const initialOwnerData : OwnerData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
};

export function FormProvider({ children }: { children: ReactNode }) {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [spaces, setSpaces] = useState<SpaceInt[]>(initialSpaces);
    const [currentStep, setCurrentStep] = useState(1);
    const resetForm = () => {
    setFormData(initialFormData);
    setSpaces(initialSpaces);
    setCurrentStep(1);
    };

    return (
    <FormContext.Provider
        value={{
        formData,
        setFormData,
        spaces,
        setSpaces,
        currentStep,
        setCurrentStep,
        resetForm
        }}
    >
        {children}
    </FormContext.Provider>
    );
}

export function AdminFormProvider({ children }: { children: ReactNode }) {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [spaces, setSpaces] = useState<SpaceInt[]>(initialSpaces);
    const [currentStep, setCurrentStep] = useState(1);
    const [ownerData, setOwnerData] = useState<OwnerData>(initialOwnerData);
    const resetForm = () => {
    setFormData(initialFormData);
    setSpaces(initialSpaces);
    setCurrentStep(1);
    };

    return (
    <AdminFormContext.Provider
        value={{
        formData,
        setFormData,
        spaces,
        setSpaces,
        currentStep,
        setCurrentStep,
        ownerData,
        setOwnerData,
        resetForm
        }}
    >
        {children}
    </AdminFormContext.Provider>
    );
}


export function useFormContext() {
    const context = useContext(FormContext);
    if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
    }
    return context;
}

export function useAdminFormContext() {
    const context = useContext(AdminFormContext);
    if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
    }
    return context;
}
