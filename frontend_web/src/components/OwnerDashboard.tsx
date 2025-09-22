import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";
import { Badge } from "./ui/badge.tsx";
import { Progress } from "./ui/progress.tsx";
import { Input } from "./ui/input.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { Label } from "./ui/label.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";
import { Button } from "./ui/button.tsx";
import { Building, FileText, Key, Plus, TrendingUp, Calendar } from "lucide-react";
import { UserCog, ArrowRightLeft, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect} from "react";
import { getOwnerId, getProperty, Property, getPropertyImages } from "../../../backend/FetchData.ts";
import supabase from "../../../config/supabaseClient.ts"



interface OwnerDashboardProps {
  userId: string;
  onAddProperty: () => void;
}

// interface ChangeLog {
//   property_id: any;
//   changelog_id: string;
//   asset_id: string;
//   changelog_specifications: Record<string, any>;
//   changelog_description: string;
//   changedlog_changed_by_user_id: string;
//   changelog_status: string;
//   changelog_created_at: string;
// }

interface ChangeLog {
  property_id: string;
  changelog_id: string;
  changelog_specifications: Record<string, any>;
  changelog_description: string;
  changelog_status: "pending" | "approved" | "rejected" | "ACCEPTED"; // unify later
  changelog_created_at: string;
  user_first_name: string | null;
  user_last_name: string | null;
}


export function OwnerDashboard({ userId }: OwnerDashboardProps) {
  const [myProperties, setOwnerProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ChangeLog[]>([]);

  useEffect (() => {
    const getOwnerProps = async () => {
      try {
        // Get owner id
        const ownerId = await getOwnerId(userId);
        if (!ownerId) throw Error("Owner ID not found");
        
        const properties = await getProperty(userId);
        setOwnerProperties(properties ?? []);


        if (properties && properties.length > 0) {
          const propertyIds = properties.map((p: any) => p.property_id);
          const { data: changes, error: changesError } = await supabase
            .from("changelog_property_view")
            .select(`
              changelog_id,
              changelog_specifications,
              changelog_description,
              changelog_created_at,
              changelog_status,
              property_id,
              user_first_name,
              user_last_name
            `)
            .in("property_id", propertyIds)
            .order("changelog_created_at", { ascending: false });

          if (changesError) {
            console.error("Error fetching change log:", changesError);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "default";
      default: return "secondary";
    }
  };

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
        r.changelog_id === id ? { ...r, changelog_status: "ACCEPTED" } : r
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
        r.changelog_id === id ? { ...r, changelog_status: "DECLINED" } : r
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
                <TableBody className="overflow-y:auto height:200px">
                  {requests.slice(0, 15).map((request) => (
                    <TableRow key={request.changelog_id}>
                      <TableCell className="font-medium">
                        {myProperties.find(
                          (p) => p.property_id === request.property_id)?.address ?? "Unknown Property"}
                      </TableCell>
                      <TableCell>
                        {request.user_first_name || request.user_last_name
                          ? `${request.user_first_name ?? ""} ${request.user_last_name ?? ""}`.trim()
                          : "Unknown User"}
                      </TableCell>
                      <TableCell>{request.changelog_description}</TableCell>
                      <TableCell>{formatDate(request.changelog_created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={getEditStatusColor(request.changelog_status)}>
                          {request.changelog_status}
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
                              </DialogHeader>
                              <div className="space-y-6">
                                <div>
                                  <Label>Property</Label>
                                  <Input value={myProperties.find(
                                  (p) => p.property_id === request.property_id)?.address ?? "Unknown Property"} readOnly />
                                </div>
                                <div className="grid gap-4 md:grid-cols-1">
                                  <div>
                                    <Label>Requested By</Label>

                                    <Input value={`${request.user?.first_name ?? ""} ${request.user?.last_name ?? ""}`} readOnly />

                                  </div>
                                  <div>
                                    <Label>Request Time</Label>
                                    <Input value={formatDateTime(request.changelog_created_at)} readOnly />
                                  </div>
                                </div>
                                <div>
                                    <Label>Change Description</Label>
                                    <Input value={request.changelog_description} readOnly />
                                  </div>
                                <div>
                                  <Label>Field Specification</Label>
                                  <td className="px-4 py-2">
                                    <ul className="text-xs space-y-1">
                                      {Object.entries(request.changelog_specifications).map(([key, value]) => (
                                        <li key={key}>
                                          <strong>{key}:</strong> {String(value)}
                                        </li>
                                      ))}
                                    </ul>
                                  </td>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => rejectEdit(request.changelog_id)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                  <Button onClick={() => approveEdit(request.changelog_id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {/* {request.changelog_status === "ACCEPTED" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveEdit(request.changelog_id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => rejectEdit(request.changelog_id)}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )} */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Properties</CardTitle>
            <Button size="sm" variant="outline" onClick={onAddProperty}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </CardHeader>
          
          <CardContent>
            <div className="flex overflow-x-auto py-6 gap-6">
              {myProperties.map((property) => (
                <div key={property.property_id} className="flex-none w-96 sm:w-80 md:w-96 lg:w-[28rem] xl:w-[32rem] flex flex-col p-6 sm:p-8 rounded-2xl bg-gray-50 shadow-md hover:shadow-lg transition">
                  

                  {/* property image */}
                  <div className="w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {property.splash_image ? (
                      <img
                        src={property.splash_image}
                        alt={`${property.address} splash`}
                        className="max-h-40 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-muted-foreground">No image</span>
                    )}
                  </div>

                  {/* property info */}
                  <div className="flex-1 mt-4">
                    <div className="font-large">{property.address}</div>
                    <div className="text-medium text-muted-foreground">
                      {property.name}
                    </div>
                  </div>
                </div>
              ))}

              {myProperties.length === 0 && (
                <div className="text-center py-6">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Properties Yet</h3>
                  <p className="text-muted-foreground">
                    Add your first property to get started
                  </p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>
              )}
            </div>
          </CardContent>

        </Card>
      </div>

    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4">
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
                    <p className="text-xs text -muted-foreground">
                      {metric.change}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>
      {/* <Card>
        <CardHeader>
          <CardTitle>Property Portfolio Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Properties with Complete Information</span>
              <span>85%</span>
            </div>
            <Progress value={85} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Up-to-date Utility Records</span>
              <span>92%</span>
            </div>
            <Progress value={92} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Recent Property Reports</span>
              <span>75%</span>
            </div>
            <Progress value={75} />
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}