// src/services/authService.ts
/// <reference types="vite/client" />
import supabase from "../config/supabaseClient";


const MINPASSWORDLEN = 4;

export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  userType: "admin" | "owner";
};

export async function signupUser(signupData: SignupData) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: signupData.email,
    password: signupData.password,
  });

  if (authError) throw new Error(authError.message);

  const userId = authData.user?.id;
  if (!userId) throw new Error("User ID not returned from signup");

  // 2. Insert into main User table
  const { error: insertError } = await supabase.from("User").insert([
    {
      user_id: userId,
      email: signupData.email,
      first_name: signupData.first_name,
      last_name: signupData.last_name,
      phone: signupData.phone,
    },
  ]);

  if (insertError) throw new Error(insertError.message);

  // 3. Insert into role-specific table
  if (signupData.userType === "owner") {
    const { error: ownerError } = await supabase
      .from("Owner")
      .insert([{ user_id: userId }]);
    if (ownerError) throw new Error(ownerError.message);
  } else if (signupData.userType === "admin") {
    const { error: adminError } = await supabase
      .from("Admin")
      .insert([{ user_id: userId }]);
    if (adminError) throw new Error(adminError.message);
  }

  return { email: signupData.email, userType: signupData.userType , userId};
}

export async function loginUser(email: string, password: string) {
  // 1. Authenticate
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);

  const userId = data.user?.id;
  if (!userId) throw new Error("User ID not returned on login");

  // 2. Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("User")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileError) throw new Error(profileError.message);

  // 3. Determine role
  const { data: ownerData } = await supabase
    .from("Owner")
    .select("user_id, owner_id")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: adminData } = await supabase
    .from("Admin")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const userType: "owner" | "admin" = adminData ? "admin" : "owner";

  return { email: profile.email, userType , userId};
}

export const validateSignup = async (signupData: SignupData) => {
  const newErrors: Record<string, string[]> = {};
  newErrors.first_name = [];
  newErrors.last_name = [];
  newErrors.email = [];
  newErrors.phone = [];
  newErrors.password = [];
  // First name and last name allows Unicode characters for accent mark and so on, no numbers or special characters except from dashes
  // or apostrophe and so on.
  if (!signupData.first_name.trim().match(/^[\p{L}]+(?:[\s'-][\p{L}]+)*$/u))
    newErrors.first_name.push("Invalid first name.");
  if (!signupData.last_name.trim().match(/^[\p{L}]+(?:[\s'-][\p{L}]+)*$/u)) 
    newErrors.last_name.push("Invalid last name.");

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
// async function domainExists(email: string): Promise<boolean> {
//   const domain = email.split("@")[1];
//   if (domain === "housebook.com") return true;
//   try {
//     const records = await dns.resolveMx(domain);
//     return records && records.length > 0;
//   } catch {
//     return false;
//   }
// }

// async function isValidEmail(email: string): Promise<boolean> {
//   const trimmedEmail = email.trim();

//   // Allow special housebook.com domain
//   if (trimmedEmail.endsWith("@housebook.com")) {
//     return true;
//   }

//   const domain = trimmedEmail.split("@")[1];
//   try {
//     const records = await dns.resolveMx(domain);
//     return true;
//   } catch {
//     return false; // Domain does not exist
//   }
// }


export const validateEmail = async (email: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("User not logged in");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`},
      body: JSON.stringify({ email }),
    }
  );

  const data = await res.json();
  console.log(data);
  return data;
};
