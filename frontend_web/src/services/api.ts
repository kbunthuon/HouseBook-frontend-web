const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface Property {
  property_id: string;
  name: string;
  address: string;
  type: string;
  status: string;
  completionStatus: string;
}

export const fetchPropertiesByOwner = async (ownerEmail: string): Promise<Property[]> => {
  const res = await fetch(`${BACKEND_URL}/properties?ownerEmail=${encodeURIComponent(ownerEmail)}`);
  if (!res.ok) throw new Error("Failed to fetch properties");
  return res.json();
};
