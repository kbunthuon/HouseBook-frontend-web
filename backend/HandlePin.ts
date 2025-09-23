import supabase from "../config/supabaseClient";

// insert new row in supabase, autogenerates a new pin
export async function createPropertyPin(
    propertyId: string,
    durationMinutes = 60
  ): Promise<pin | null> {
    const start = new Date();
    const end = new Date(Date.now() + durationMinutes * 60 * 1000);
    const { data, error } = await supabase
      .from("PropertyPins")
      .insert([
        {
          property_id: propertyId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        },
      ])
      .select()
      .single();
  
    if (error) {
      console.error("Error creating property pin:", error);
      throw error;
    }
  
    return data;
  }

// delete pin row 
export const deletePin = async (pin: string) => {
    const { error } = await supabase
    .from('PropertyPins')
    .delete()
    .eq('some_column', 'someValue')
}

// fetch all pin
export const fetchAllPin = async (pin: string) => {
    let { data: PropertyPins, error } = await supabase
    .from('PropertyPins')
    .select('*')
}

export type pin = { 
    id: string;
    start_time: string; 
    end_time: string; 
    asset_id?: string[];
    tradie_id?: string[];
    pin: string;
    description: string;
};
