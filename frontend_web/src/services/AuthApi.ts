import { SignupData, LoginResponse } from "../types";



const BASE_URL = import.meta.env.VITE_BACKEND_URL; // replace with your Render backend URL

// Signup function
export const signup = async (signupData: SignupData): Promise<LoginResponse | { errors: any }> => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signupData),
  });

  if (!res.ok) {
    const data = await res.json();
    return { errors: data.errors || { general: "Signup failed" } };
  }

  return res.json();
};

// Login function
export const login = async (email: string, password: string): Promise<LoginResponse | { errors: any }> => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { errors: data.errors || { general: "Login failed" } };
  }

  return res.json();
};

// Validate signup
export const validateSignup = async (signupData: SignupData): Promise<{ valid: boolean; errors: any }> => {
  const res = await fetch(`${BASE_URL}/auth/validate-signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signupData),
  });

  if (!res.ok) {
    const data = await res.json();
    return { valid: false, errors: data.errors || { general: "Validation failed" } };
  }

  return res.json();
};

// Validate login
export const validateLogin = async (email: string, password: string): Promise<{ valid: boolean; errors: any }> => {
  const res = await fetch(`${BASE_URL}/auth/validate-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { valid: false, errors: data.errors || { general: "Validation failed" } };
  }

  return res.json();
};