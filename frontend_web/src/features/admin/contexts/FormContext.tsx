// Admin Form Context
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FormData, SpaceInt, Owner } from "@shared/types/serverTypes";

interface AdminFormContextType {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    spaces: SpaceInt[];
    setSpaces: React.Dispatch<React.SetStateAction<SpaceInt[]>>;
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    owner: any;
    setOwner: React.Dispatch<React.SetStateAction<any>>;
    resetForm: () => void;
}

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

const initialOwner: any = {
    userId: "",
    name: "",
    email: "",
    propertyCount: 0
};

interface AdminFormProviderProps {
    children: ReactNode;
}

export const AdminFormProvider: React.FC<AdminFormProviderProps> = ({ children }) => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [spaces, setSpaces] = useState<SpaceInt[]>(initialSpaces);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [owner, setOwner] = useState<any>(initialOwner);

    const resetForm = () => {
        setFormData(initialFormData);
        setSpaces(initialSpaces);
        setCurrentStep(0);
        setOwner(initialOwner);
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
};

export const useAdminFormContext = () => {
    const context = useContext(AdminFormContext);
    if (context === undefined) {
        throw new Error('useAdminFormContext must be used within a AdminFormProvider');
    }
    return context;
};