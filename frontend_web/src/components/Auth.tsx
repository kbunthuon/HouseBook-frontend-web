import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Building } from "lucide-react";
import { signupUser, loginUser, validateLogin, validateSignup } from "../../../backend/AuthService";

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
    userType: "owner" as "admin" | "owner"
  });
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const newErrors = await validateSignup(signupData);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Validation passes, check if backend is able to sign up
    try {
      const result = await signupUser(signupData);
      if (result) {
        onLogin(result.email, result.userType, result.userId);
        console.log("Signup successful!", result);
      }
    } catch (err: any) {
      setServerError(err.message || "Sign-up failed. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const newErrors = await validateLogin(loginEmail, loginPassword);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;

    // Validation passes, check if this user info exists as an owner or an admin
    try {
      const result = await loginUser(loginEmail, loginPassword);
      if (result) {
        onLogin(result.email, result.userType, result.userId);
        console.log("Signup successful!", result);
      }
    } catch (err: any) {
      setServerError(err.message || "Sign-in failed. Please try again.");
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
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@housebook.com"
                      autoComplete="on"
                      required
                    />
                    {errors.loginEmail && (
                      <p className="text-red-600 text-sm mt-1">{errors.loginEmail}</p>
                    )}
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
                    {errors.loginPassword && (
                      <p className="text-red-600 text-sm mt-1">{errors.loginPassword}</p>
                    )}
                    {serverError && (
                      <p className="text-red-600 text-sm mt-1">{serverError}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
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
                      onChange={(e) =>
                        setSignupData({ ...signupData, first_name: e.target.value })
                      }
                      autoComplete="on"
                      placeholder="John"
                      required
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-sm">{errors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="signup-last-name">Last Name</Label>
                    <Input
                      id="signup-last-name"
                      value={signupData.last_name}
                      onChange={(e) =>
                        setSignupData({ ...signupData, last_name: e.target.value })
                      }
                      autoComplete="on"
                      placeholder="Doe"
                      required
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-sm">{errors.last_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      value={signupData.email}
                      onChange={(e) => {
                        const email = e.target.value;
                        setSignupData((prev) => ({
                          ...prev,
                          email,
                          userType: email.includes("@housebook.com")
                            ? "admin"
                            : "owner",
                        }));
                      }}
                      placeholder="john@company.com"
                      autoComplete="on"
                      required
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="signup-phone">Phone</Label>
                    <Input
                      id="signup-phone"
                      value={signupData.phone}
                      onChange={(e) =>
                        setSignupData({ ...signupData, phone: e.target.value })
                      }
                      placeholder="04-123-456-78"
                      autoComplete="on"
                      required
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({ ...signupData, password: e.target.value })
                      }
                      placeholder="••••••••"
                      required
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm">{errors.password}</p>
                    )}
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
