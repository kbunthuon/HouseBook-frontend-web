import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ROUTES } from "../Routes";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { useState, useEffect } from "react";
import { getPropertyOwners, getPropertyDetails } from "../../../backend/FetchData";
import { Property, Owner } from "../types/serverTypes";
import { validateLogin } from "../../../backend/AuthService"
import { Card, CardContent } from "./ui/card";

// // --- replace with real APIs ---
// async function fetchPropertyName(propertyId: string) {
//   // e.g., supabase.from("properties").select("name").eq("id", propertyId).single()
//   return "Rose Wood Retreat";
// }
// async function signInAndCreateTransfer(args: {
//   email: string; password: string; propertyId: string; requesterUserId: string;
// }) {
//   // 1) await supabase.auth.signInWithPassword({ email, password })
//   // 2) await supabase.rpc("create_property_transfer_request", { property_id: propertyId, requester_user_id: requesterUserId })
//   await new Promise(r => setTimeout(r, 500));
// }
// // --------------------------------

interface TransferRequestPageProps {
  propertyId: string;
  userId: string;
  onViewTransfer?: (propertyId: string) => void; 
}

export default function TransferRequestPage({
  propertyId,
  userId,
  onViewTransfer,
  
}: TransferRequestPageProps) {
  // const { id: propertyId = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyName, setPropertyName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // React.useEffect(() => {
  //   let cancelled = false;
  //   (async () => {
  //     const name = await fetchPropertyName(propertyId);
  //     if (!cancelled) setPropertyName(name);
  //   })();
  //   return () => { cancelled = true; };
  // }, [propertyId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("user id: ", {userId});
        console.log("property id: ", {propertyId});

        const result = await getPropertyDetails(propertyId);
        if (result) setProperty(result);
        else setError("Property not found");

      } catch (err: any) {
        setError(err.message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId]);

  const onSubmit = async (e: React.FormEvent) => {
    if (!propertyId) return;
    navigate(ROUTES.propertyTransferSubmittedPath(propertyId)); 

    e.preventDefault();
    setSubmitting(true);
    setError(null);
  
    const res = await validateLogin(email, password);
    if (!res.ok) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }
    
    
    // res.userId is the verified identity — create the transfer request
    //await createTransferRequest({ propertyId, requesterUserId: res.userId });
    // navigate(ROUTES.propertyTransferSubmittedPath(propertyId));
  };

  

  return (
    
    <div className="min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-md items-center justify-center">
        <div className="mb-6 space-y-1">
          <h1>Property Transfer for {property?.name ?? "No name"}:</h1>
          <p className="text-muted-foreground">
          Submit a property transfer request
          </p>
        </div>
      </div>
    
      <Card>
        <CardContent>
        <form className="p-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="admin@housebook.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <p className="text-sm">
            Don’t have an account?{" "}
            <Link to="/login" className="text-green-600 hover:underline">
              Create one here.
            </Link>
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="w-full h-11 text-base">
              {submitting ? "Submitting…" : "Transfer Request"}
            </Button>
            
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
}
