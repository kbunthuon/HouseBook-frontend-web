import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Building } from "lucide-react";
import { signupUser, loginUser } from "../services/AuthService";

interface AuthProps {
  onLogin: (email: string, userType: "admin" | "owner") => void;
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
    try {
      const result = await signupUser(signupData);
      onLogin(result.email, result.userType);
      console.log("Signup successful!", result);
    } catch (err: any) {
      console.error("Signup failed:", err.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await loginUser(loginEmail, loginPassword);
      onLogin(result.email, result.userType);
      console.log("Login successful!", result);
    } catch (err: any) {
      console.error("Login failed:", err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">HouseBook</h1>
          <p className="text-muted-foreground">Admin Portal</p>
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
              
              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginEmail}
                      onChange={(e: React.FormEvent) => setLoginEmail(e.target.value)}
                      placeholder="admin@housebook.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e: React.FormEvent) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Login</Button>
                </form>
              </TabsContent>
              
              {/* Signup */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-first-name">First Name</Label>
                    <Input
                      id="signup-first-name"
                      value={signupData.first_name}
                      onChange={(e: React.FormEvent) => setSignupData({...signupData, first_name: e.target.value})}
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
                      onChange={(e) => {
                        const email = e.target.value;
                        setSignupData((prev) => ({
                          ...prev,
                          email,
                          userType: email.includes("@housebook.com") ? "admin" : "owner",
                        }));
                      }}
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-phone">Phone</Label>
                    <Input
                      id="signup-phone"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                      placeholder="000"
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
                  <Button type="submit" className="w-full">Create Account</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
