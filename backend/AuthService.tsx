// src/services/authService.ts
import supabase from "../config/supabaseClient";

export async function signupUser(signupData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  userType: "admin" | "owner";
}) {
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
