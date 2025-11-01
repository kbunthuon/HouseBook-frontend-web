// src/services/authService.ts
/// <reference types="vite/client" />
import { supabase } from "../config/supabaseClient";
import { SignupData } from "@housebookgroup/shared-types";

const MINPASSWORDLEN = 4;


export const validateSignup = async (signupData: SignupData) => {
  const newErrors: Record<string, string[]> = {};
  newErrors.first_name = [];
  newErrors.last_name = [];
  newErrors.email = [];
  newErrors.phone = [];
  newErrors.password = [];
  // First name and last name allows Unicode characters for accent mark and so on, no numbers or special characters except from dashes
  // or apostrophe and so on.
  if (!signupData.firstName.trim().match(/^[\p{L}]+(?:[\s'-][\p{L}]+)*$/u))
    newErrors.firstName.push("Invalid first name.");
  if (!signupData.lastName.trim().match(/^[\p{L}]+(?:[\s'-][\p{L}]+)*$/u)) 
    newErrors.lastName.push("Invalid last name.");

  // Match email so that it matches string@string.string format
  const valid = await validateEmail(signupData.email);
  if (!valid) {
    newErrors.email.push("Invalid email format or domain does not exist.");
  }

  // Checks for valid phone number and dashes if there are any
  if (!signupData.phone.match(/^[0-9]{2,4}[- ]?[0-9]{3,4}[- ]?[0-9]{3,4}$/))
    newErrors.phone.push("Invalid phone number format.");

  // Makes sure the password is at least MINPASSWORDLEN long
  // Has one uppercase letter, one lowercase letter, one digit and one special character
  const passwordErrors: string[] = [];
  const password = signupData.password;

  if (password.length < MINPASSWORDLEN)
    passwordErrors.push(`Password must be at least ${MINPASSWORDLEN} characters.`);
  if (!/[A-Z]/.test(password))
    passwordErrors.push("Password must contain at least one uppercase letter.");
  if (!/[a-z]/.test(password))
    passwordErrors.push("Password must contain at least one lowercase letter.");
  if (!/[0-9]/.test(password))
    passwordErrors.push("Password must contain at least one digit.");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    passwordErrors.push("Password must contain at least one special character.");

  if (passwordErrors.length > 0) newErrors.password = passwordErrors;

  return newErrors;
};

export const validateLogin = async (loginEmail: string, loginPassword: string) => {
  const newErrors: Record<string, string> = {};

  const valid = await validateEmail(loginEmail);
  if (!valid) {
    newErrors.loginEmail = "Invalid email format or domain does not exist.";
  }
  if (loginPassword.length < MINPASSWORDLEN)
    newErrors.loginPassword = `Password must be at least ${MINPASSWORDLEN} characters.`;

  return newErrors;
};


// ---------------HELPER FUNCTIONS---------------------------
// export const validateEmail = async (email: string) => {
//   try {
//     const res = await fetch(
//       `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       }
//     );

//     if (!res.ok) {
//       const errorText = await res.text();
//       console.error("Error response:", errorText);
//       return { valid: false, reason: "Failed to validate email" };
//     }

//     const data = await res.json();
//     console.log("Email validation result:", data);
//     return data;
//   } catch (err: any) {
//     console.error("Network or DNS error:", err);
//     return { valid: false, reason: err.message };
//   }
// };
export const validateEmail = async (email: string) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!res.ok) {
      // handle HTTP errors
      const text = await res.text();
      console.error("Error response:", text);
      return { valid: false, reason: text };
    }

    const data = await res.json();
    console.log("validateEmail response:", data);
    return data; // { valid: boolean, records?: MXRecord[] }
  } catch (err: unknown) {
    console.error("Network or fetch error:", err);
    const reason = err instanceof Error ? err.message : String(err);
    return { valid: false, reason };
  }
};

