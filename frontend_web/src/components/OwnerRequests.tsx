import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";
import { Badge } from "./ui/badge.tsx";
import { Progress } from "./ui/progress.tsx";
import { Input } from "./ui/input.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { Label } from "./ui/label.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";
import { Button } from "./ui/button.tsx";
import { Building, FileText, Key, Plus, TrendingUp, Calendar } from "lucide-react";
import { UserCog, ArrowRightLeft, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect} from "react";
import { getOwnerId, getProperty, getPropertyImages, getChangeLogs } from "../../../backend/FetchData.ts";
import { Property, ChangeLog} from "../types/serverTypes.ts";
import supabase from "../../../config/supabaseClient.ts"
import { apiClient } from "../api/wrappers.ts";


interface OwnerChangeLog extends ChangeLog {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

interface OwnerRequestsProps {
  userId: string;
}

export function OwnerRequests({ userId }: OwnerRequestsProps) {
  const [myProperties, setOwnerProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<OwnerChangeLog[]>([]);

  useEffect (() => {
      const getOwnerProps = async () => {
        try {
          // Get owner id
          const ownerId = await apiClient.getOwnerId(userId);
          if (!ownerId) throw Error("Owner ID not found");
          
          const properties = await apiClient.getPropertyList(userId);
          setOwnerProperties(properties ?? []);
  
  
          if (properties && properties.length > 0) {
          const propertyIds = properties.map((p: any) => p.propertyId);
          const changes = await getChangeLogs(propertyIds);
  
            if (!changes) {
            console.error("Error fetching change logs.");
            setLoading(false);
            return;
          }
  
            // Normalizing user from array so that it is a single object
            const normalizedChanges = (changes ?? []).map((c: any) => ({
              ...c,
              user: c.user && c.user.length > 0 ? c.user[0] : null,
            }));
  
            setRequests(normalizedChanges);
          } else {
            setRequests([]);
          }
  
        } catch (error) {
          console.error(error);
          setOwnerProperties([]);
  
        } finally {
          setLoading(false);
        }
      };
  
      getOwnerProps();
  
    },[userId])


const approveEdit = async (id: string) => {
    const { data, error } = await supabase
      .from("ChangeLog")
      .update({ status: "ACCEPTED" })
      .eq("id", id);

    console.log("data", data);
    if (error) {
      console.error("Error updating change log status:", error);
    } else {
      console.log(`Approved edit ${id}`);
      setRequests(prev =>
      prev.map(r =>
        r.id === id ? { ...r, changelog_status: "ACCEPTED" } : r
      )
      );

    }
  };

const rejectEdit = async (id: string) => {
    const { data, error } = await supabase
      .from("ChangeLog")
      .update({ status: "DECLINED" })
      .eq("id", id);

    if (error) {
      console.error("Error updating change log status:", error);
    } else {
      console.log(`Declined edit ${id}`);
      setRequests(prev =>
      prev.map(r =>
        r.id === id ? { ...r, changelog_status: "DECLINED" } : r
      )
      );
    }
  }

  const getEditStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "default";
      case "ACCEPTED":
        return "secondary";
      case "DECLINED":
        return "destructive";
      default:
        return "secondary";
    }
};

function formatDate(timestamp: string | number | Date) {
  const dateObject = new Date(timestamp);
  return dateObject.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(timestamp: string | number | Date) {
  const dateObject = new Date(timestamp);
  return dateObject.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}


  return (
    <div className="space-y-8">
      <div>
        <h1>My Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your property portfolio
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
  <CardHeader>
    <CardTitle>All Edit Requests</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="max-h-[600px] overflow-y-auto border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow className="bg-muted/50">
            <TableHead>Property</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Change Description</TableHead>
            <TableHead>Request Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Inspect</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {myProperties.find(
                    (p) => p.propertyId === request.propertyId)?.address ?? "Unknown Property"}
                </TableCell>
                <TableCell>
                  {request.userFirstName || request.userLastName
                    ? `${request.userFirstName ?? ""} ${request.userLastName ?? ""}`.trim()
                    : "Unknown User"}
                </TableCell>
                <TableCell>{request.changeDescription}</TableCell>
                <TableCell>{formatDate(request.created_at)}</TableCell>
                <TableCell>
                  <Badge variant={getEditStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Request Details</DialogTitle>
                          <DialogDescription>Review the requested changes and approve or decline.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div>
                            <Label>Property</Label>
                            <Input 
                              value={myProperties.find(
                                (p) => p.propertyId === request.propertyId)?.address ?? "Unknown Property"} 
                              readOnly 
                            />
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label>Requested By</Label>
                              <Input 
                                value={`${request.userFirstName ?? ""} ${request.userLastName ?? ""}`.trim() || "Unknown User"} 
                                readOnly 
                              />
                            </div>
                            <div>
                              <Label>Request Time</Label>
                              <Input value={formatDateTime(request.created_at)} readOnly />
                            </div>
                          </div>
                          <div>
                            <Label>Asset Name</Label>
                            <Input 
                              value={request.assetName || 'N/A'} 
                              readOnly 
                            />
                          </div>
                          <div>
                            <Label>Change Description</Label>
                            <Input 
                              value={request.changeDescription} 
                              readOnly 
                            />
                          </div>
                          <div>
                            <Label>Specification</Label>
                            <div className="p-4 border rounded-lg bg-gray-50">
                              <ul className="text-sm space-y-2">
                                {request.specifications && Object.entries(request.specifications).map(([key, value]) => (
                                  <li key={key} className="flex justify-between">
                                    <strong className="text-muted-foreground">{key}:</strong>
                                    <span>{String(value)}</span>
                                  </li>
                                ))}
                                {(!request.specifications || Object.keys(request.specifications).length === 0) && (
                                  <li className="text-muted-foreground">No specifications</li>
                                )}
                              </ul>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => rejectEdit(request.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                            <Button onClick={() => approveEdit(request.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mb-2" />
                  <p className="font-medium">No edit requests</p>
                  <p className="text-sm">All changes have been processed</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>
      </div>
    </div>
  );
}