// FormContext.tsx - Create this new file
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FormData, SpaceInt, Owner } from "@shared/types/serverTypes";

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
    owner: Owner;
    setOwner: React.Dispatch<React.SetStateAction<Owner>>;
    resetForm: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);
const AdminFormContext = createContext<AdminFormContextType | undefined>(undefined);

const initialFormData: FormData = {
    propertyName: "",
    propertyDescription: "",
    address: "",
    totalFloorArea: 0,
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

const initialOwnerData : Owner = {
    ownerId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
};

export function FormProvider({ children }: { children: ReactNode }) {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [spaces, setSpaces] = useState<SpaceInt[]>([]);
    const [currentStep, setCurrentStep] = useState(1);
    const resetForm = () => {
        setFormData(initialFormData);
        setSpaces([]);
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
    const [spaces, setSpaces] = useState<SpaceInt[]>([]);
    const [currentStep, setCurrentStep] = useState(1);
    const [owner, setOwner] = useState<Owner>(initialOwnerData);
    const resetForm = () => {
        setFormData(initialFormData);
        setSpaces([]);
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
        owner,
        setOwner,
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
