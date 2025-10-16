import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";
import { Badge } from "./ui/badge.tsx";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";
import { Button } from "./ui/button.tsx";
import { Building, FileText, Key, Plus, TrendingUp, Calendar } from "lucide-react";
import { UserCog, ArrowRightLeft, Eye, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { useState, useEffect} from "react";
import { getAdminProperty, getAllOwners, getChangeLogs } from "../../../backend/FetchData.ts";
import supabase from "../../../config/supabaseClient.ts"
import { Property, Owner, ChangeLog} from "../types/serverTypes.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { apiClient } from "../api/wrappers.ts";

interface OwnerChangeLog extends ChangeLog {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

interface DashboardProps {
  userId: string;
  userType: string;
  onAddProperty?: () => void;
  onViewProperty?: (propertyId: string) => void;
}

export function Dashboard({ userId, userType, onAddProperty, onViewProperty }: DashboardProps) {
  const [myProperties, setOwnerProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<OwnerChangeLog[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);

  useEffect (() => {
      const getOwnerProps = async () => {
        try {
          
          const properties = await getAdminProperty(userId, userType);
          // Remove duplicate properties by propertyId
          const uniquePropertiesMap = new Map();
          properties?.forEach((p: any) => {
            if (!uniquePropertiesMap.has(p.propertyId)) {
              uniquePropertiesMap.set(p.propertyId, p);
            }
          });
      
          const uniqueProperties = Array.from(uniquePropertiesMap.values());
          setOwnerProperties(uniqueProperties ?? []);
          
          console.log(uniqueProperties);
          if (uniqueProperties && uniqueProperties.length > 0) {
          const propertyIds = [...new Set(uniqueProperties.map((p: any) => p.propertyId))];
          const changes = await getChangeLogs(propertyIds);

          const ownersResults = await getAllOwners();
          setOwners(ownersResults);
  
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


  const metrics = [
    {
      title: "All Properties",
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
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your property management system
        </p>
      </div>

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
                  className="w-80 h-80 bg-gray-50 rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col cursor-pointer"
                  style={{ minWidth: '320px', maxWidth: '320px'}}
                  onClick={() => onViewProperty && onViewProperty(property.propertyId)}
                >
                  {/* property image */}
                  <div className="w-full flex-1 bg-muted flex items-center justify-center">
                    {property.splashImage ? (
                      <img
                        src={property.splashImage}
                        alt={`${property.address} splash`}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Building className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* property info */}
                  <div className="h-32 flex-shrink-0 flex flex-col justify-end text-center" >
                    <div className="font-semibold text-md truncate px-4">
                      {property.name || 'N/A'}
                    </div>
                    <div className="font-muted text-md truncate px-4">
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

    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Changes</CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="owners" className="w-full">
        <TabsList>
            <TabsTrigger value="owners">Owners</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCog className="mr-2 h-5 w-5" />
                Audit Log
              </CardTitle>
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
                <TableBody className="max-h-[300px] overflow-y-auto border rounded-lg">
              {requests.filter((request) => request.status !== "ACCEPTED").length > 0 ? (
              requests
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
        </TabsContent>

        <TabsContent value="owners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCog className="mr-2 h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.length > 0 ? (
                owners.map((owner) => (
                  <TableRow key={owner.ownerId}>
                    <TableCell className="font-medium">
                      {owner.firstName || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {owner.lastName || 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {owner.email || 'No email'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UserCog className="h-8 w-8 mb-2" />
                      <p className="font-medium">No owners found</p>
                      <p className="text-sm">This property has no registered owners</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      </CardContent>

    </Card>

    {/* Metrics */}
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
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    
    </div>
  );
}
