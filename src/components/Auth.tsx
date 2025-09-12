import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Building } from "lucide-react";
import supabase from "../config/supabaseClient.ts"

interface AuthProps {
  onLogin: (email: string, userType: "admin" | "owner", user_id: string) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    userType: "owner" as "admin" | "owner",
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
    });

    if (authError) {
      console.error("Signup failed:", authError.message);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) return;

    // Insert into main User table
    const { error: insertError } = await supabase.from("User").insert([
      {
        user_id: userId,
        email: signupData.email,
        first_name: signupData.first_name,
        last_name: signupData.last_name,
        phone: signupData.phone,
      },
    ]);

    if (insertError) {
      console.error("Profile insert failed:", insertError.message);
      return;
    }

    // Insert into role-specific table
    if (signupData.userType === "owner") {
      const { error: ownerError } = await supabase
        .from("Owner")
        .insert([{ user_id: userId }]);
      if (ownerError) console.error("Owner insert failed:", ownerError.message);
    } else if (signupData.userType === "admin") {
      const { error: adminError } = await supabase
        .from("Admin")
        .insert([{ user_id: userId }]);
      if (adminError) console.error("Admin insert failed:", adminError.message);
    }

    console.log("Signup successful!");

    // Log in immediately after signup (?)
    onLogin(signupData.email, signupData.userType, signupData.user_id);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Authenticate
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      console.error("Login failed:", error.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) return;

    // Fetch profile from User table
    const { data: profile, error: profileError } = await supabase
      .from("User")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch failed:", profileError.message);
      return;
    }

    // Determine role
    const { data: ownerData } = await supabase
      .from("Owner")
      .select("user_id, owner_id")
      .eq("user_id", userId)
      .single(); 

    const userType: "owner" | "admin" = ownerData ? "owner" : "admin";
    // const ownerId = ownerData?.owner_id

    onLogin(profile.email, userType, userId);
    console.log("Login successful!", profile, userType, ownerData);
  };

  // Optional: helper to handle signup form changes
  const handleSignupChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">HouseBook</h1>
          {/* <p className="text-muted-foreground">Admin Portal</p> */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@housebook.com"
                      autoComplete="on"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-first-name">First Name</Label>
                    <Input
                      id="signup-first-name"
                      value={signupData.first_name}
                      onChange={(e: React.FormEvent) => setSignupData({...signupData, first_name: e.target.value})}
                      autoComplete="on"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-last-name">Last Name</Label>
                    <Input
                      id="signup-last-name"
                      value={signupData.last_name}
                      onChange={(e: React.FormEvent) => setSignupData({...signupData, last_name: e.target.value})}
                      autoComplete="on"
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                      placeholder="john@company.com"
                      autoComplete="on"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-phone">Phone</Label>
                    <Input
                      id="signup-phone"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                      placeholder="04-123-456-78"
                      autoComplete="on"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}