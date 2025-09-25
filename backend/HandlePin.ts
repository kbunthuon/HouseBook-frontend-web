import { data } from "react-router-dom";
import supabase from "../config/supabaseClient";

export interface NewPinRow {
    property_id: string;
    tradie_id?: string;
    title: string;
    status?: "Active" | "Inactive";
    created_at?: string;              // ISO
    end_time?: string;                // ISO         
  }
  
//   export interface PinRow extends NewPinRow {
//     id: string;
//     created_at: string;
//     // last_used?: string | null;
//   }
  
  export async function createPropertyPin(row: NewPinRow) {
    const { error } = await supabase
      .from("Jobs")          
      .insert([{
        property_id: row.property_id,
        tradie_id: row.tradie_id,
        title: row.title,
        status: row.status,
        created_at: row.created_at,          
        end_time: row.end_time
      }]);
      //.select("id");
  
    // if (error) throw error;
    // return data;
    //console.log("Property and relationship inserted successfully");
    return row;
  }


// fetch all pin
// export const fetchAllPin = async (pin: string) => {
    
//     let { data: Jobs, error } = await supabase
//     .from('Jobs')
//     .select('*')

//     return data;
        
// }
