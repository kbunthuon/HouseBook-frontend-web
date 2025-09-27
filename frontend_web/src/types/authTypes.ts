export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  userType: "admin" | "owner";
};