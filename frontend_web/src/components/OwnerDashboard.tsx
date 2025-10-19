import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";
import { Badge } from "./ui/badge.tsx";
import { Progress } from "./ui/progress.tsx";
import { Input } from "./ui/input.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { Label } from "./ui/label.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "./ui/dialog.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";
import { Button } from "./ui/button.tsx";
import { Building, FileText, Key, Plus, TrendingUp, Calendar, ExternalLink } from "lucide-react";
import { UserCog, ArrowRightLeft, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect} from "react";
import { getOwnerId, getProperty, getPropertyImages, getChangeLogs } from "../../../backend/FetchData.ts";
import { Property, ChangeLog } from "../types/serverTypes.ts";
import supabase from "../../../config/supabaseClient.ts"

import { apiClient } from "../api/wrappers.ts";


interface OwnerChangeLog extends ChangeLog {
  userEmail: string;
  userFirstName: string;
  userLastName: string;
}

interface OwnerDashboardProps {
  userId: string;
  onAddProperty?: () => void;
  onViewProperty?: (propertyId: string) => void;
  
}

export function OwnerDashboard({ userId, onAddProperty, onViewProperty }: OwnerDashboardProps) {
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
          console.log("Fetching change logs for properties:", propertyIds);
          const changes = await getChangeLogs(propertyIds);
          
          if (!changes) {
            console.error("Error fetching change logs.");
            setLoading(false);
            return;
          }

          // setRequests(changes);
  
          // Normalize changes with user info
          const normalizedChanges : OwnerChangeLog[] = (changes ?? []).map((c: any) => {
            return {
              ...c,
              changedByUserFirstName: c.user?.first_name,
              changedByUserLastName: c.user?.last_name,
              changedByUserEmail: c.user?.email,
            };
          });
          
          setRequests(normalizedChanges);
          console.log("Changes in OwnerDashboard", normalizedChanges)
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

  const activeProperties = myProperties.filter(p => p.status === "Active").length;
  const pendingProperties = myProperties.filter(p => p.status === "Pending").length;

  const metrics = [
    {
      title: "My Properties",
      value: myProperties.length.toString(),
      change: "+1 this month",
      icon: Building,
      color: "text-blue-600"
    },
    {
      title: "Active Properties",
      value: myProperties.length.toString(),
      change: "All operational",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Reports Generated",
      value: "12",
      change: "+3 this month",
      icon: FileText,
      color: "text-purple-600"
    },
    {
      title: "Access Requests",
      value: "8",
      change: "+2 this week",
      icon: Key,
      color: "text-orange-600"
    }
  ];


const approveEdit = async (id: string) => {
    const { data, error } = await supabase
      .from("ChangeLog")
      .update({ status: "ACCEPTED" })
      .eq("id", id);

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

    {/* Pending Edit Requests */}
    <Card>
      <CardHeader>
        <CardTitle>Pending Edit Requests</CardTitle>
      </CardHeader>
      <CardContent>
        
        <div className="max-h-[300px] overflow-y-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Change Description</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.filter((request) => request.status !== "ACCEPTED").length > 0 ? (
              requests
              .filter((r) => r.status !== "ACCEPTED")
              .slice(0, 15)
              .map((request) => (
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
                            <DialogDescription>Make edits to pending requests and approve changes.</DialogDescription>
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
                                  value={`${request.userFirstName ?? ""} ${request.userLastName ?? ""}`} 
                                  readOnly 
                                />
                              </div>
                              <div>
                                <Label>Request Time</Label>
                                <Input value={formatDateTime(request.created_at)} readOnly />
                              </div>
                            </div>
                            <div>
                              <Label>Change Description</Label>
                              <Input value={request.changeDescription} readOnly />
                            </div>
                            <div>
                              <Label>Field Specification</Label>
                              <div className="p-4 border rounded-lg bg-gray-50">
                                <ul className="text-sm space-y-1">
                                  {Object.entries(request.specifications).map(([key, value]) => (
                                    <li key={key}>
                                      <strong>{key}:</strong> {String(value)}
                                    </li>
                                  ))}
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
                  <p className="font-medium">No pending requests</p>
                  <p className="text-sm">All edit requests have been processed</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    
    {/* Properties Preview */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Properties</CardTitle>
        <Button size="sm" variant="outline" onClick={onAddProperty}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </CardHeader>

      <CardContent>
        {myProperties.length > 0 ? (
          <div className="overflow-x-auto py-4">
            <div className="flex gap-6 w-max">
              {myProperties.map((property) => (
                <div
                  key={property.propertyId}
                  className="shrink-0 bg-gray-50 rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col cursor-pointer"
                  style={{ width: '320px', height: '320px' }}
                  onClick={() => onViewProperty && onViewProperty(property.propertyId)}
                >
                  {/* property image - fixed 188px height (320px - 132px for info section) */}
                  <div className="w-full bg-muted flex items-center justify-center overflow-hidden" style={{ height: '188px' }}>
                    {property.splashImage ? (
                      <img
                        src={property.splashImage}
                        alt={`${property.address} splash`}
                        className="w-full h-full"
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <Building className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* property info - fixed 132px height */}
                  <div className="shrink-0 flex flex-col justify-center text-center px-4" style={{ height: '132px' }}>
                    <div className="font-semibold text-md truncate">
                      {property.name || 'N/A'}
                    </div>
                    <div className="text-muted-foreground text-sm truncate">
                      {property.address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6" >
            <Building className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Properties Yet</h3>
            <p className="text-muted-foreground">
              Add your first property to get started
            </p>
            <Button className="mt-4" onClick={onAddProperty}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Metrics Grid */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
);

}