import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Building, FileText, Key, Plus, TrendingUp, Calendar } from "lucide-react";
import { UserCog, ArrowRightLeft, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect} from "react";
import { getOwnerId, getProperty } from "../services/FetchData.ts";


interface OwnerDashboardProps {
  userId: string;
}

export function OwnerDashboard({ userId }: OwnerDashboardProps) {
  const [myProperties, setOwnerProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect (() => {
    const getOwnerProps = async () => {
      try {
        // Get owner id
        const ownerId = await getOwnerId(userId);
        if (!ownerId) throw Error("Owner ID not found");
        
        const properties = await getProperty(userId);
        setOwnerProperties(properties);

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
      value: activeProperties.toString(),
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

  const upcomingTasks = [
    {
      id: 1,
      task: "Property inspection due",
      property: "Rose Wood Retreat",
      dueDate: "Tomorrow",
      priority: "high"
    },
    {
      id: 2,
      task: "Quarterly report generation",
      property: "All Properties",
      dueDate: "Next week",
      priority: "medium"
    },
    {
      id: 3,
      task: "Update utility information",
      property: "Sunset Villa",
      dueDate: "2 weeks",
      priority: "low"
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

  const approveEdit = (editId: number) => {
    console.log(`Approved transfer ${editId}`);
  };

  const rejectEdit = (editId: number) => {
    console.log(`Rejected transfer ${editId}`);
  };

  const getEditStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // TODO: Connect with database -- mock data for show
  const pendingEdits = [
    {
      id: 1,
      property: "Pine Valley Homes",
      user: "Lisa Brown",
      fieldEdited: "Utilities",
      newValue: "Changed electrical provider",
      requestDate: "2024-01-15",
      reason: "Provider no longer available",
      status: "pending"
    },
    {
      id: 2,
      property: "Sunset Gardens",
      user: "Mike Wilson",
      fieldEdited: "Owner Contact",
      newValue: "Updated email address",
      requestDate: "2024-01-12",
      reason: "Old email inactive",
      status: "approved"
    }
  ];

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Field Edited</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingEdits.map((edit) => (
                    <TableRow key={edit.id}>
                      <TableCell className="font-medium">{edit.property}</TableCell>
                      <TableCell>{edit.user}</TableCell>
                      <TableCell>{edit.fieldEdited}</TableCell>
                      <TableCell>{edit.requestDate}</TableCell>
                      <TableCell>
                        <Badge variant={getEditStatusColor(edit.status)}>
                          {edit.status}
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
                              <div className="space-y-4">
                                <div>
                                  <Label>Property</Label>
                                  <Input value={edit.property} readOnly />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label>Requested By</Label>
                                    <Input value={edit.user} readOnly />
                                  </div>
                                  <div>
                                    <Label>Field Edited</Label>
                                    <Input value={edit.fieldEdited} readOnly />
                                  </div>
                                </div>
                                <div>
                                  <Label>New Field</Label>
                                  <Textarea value={edit.newValue} readOnly />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => rejectEdit(edit.id)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                  <Button onClick={() => approveEdit(edit.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {edit.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveEdit(edit.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => rejectEdit(edit.id)}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Properties</CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-6 overflow-x-auto py-4">
              {myProperties.map((property) => (
                // <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div key={property.property_id} className="flex-none w-96 flex flex-col p-6 border rounded-2xl shadow-md hover:shadow-lg transition">
                  
                  {/* property image */}
                  <div className="h-64 w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">Property Image </span>
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">{property.address}</div>
                    <div className="text-sm text-muted-foreground">
                      Created {property.created_at}
                    </div>
                  </div>
                  {/* removed pending status */}
                  {/* <div className="flex items-center space-x-2">
                    <Badge variant={property.status === "Active" ? "default" : "secondary"}>
                      {property.status}
                    </Badge>
                  </div> */}
                </div>
              ))}
              {myProperties.length === 0 && (
                <div className="text-center py-6">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Properties Yet</h3>
                  <p className="text-muted-foreground">Add your first property to get started</p>
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

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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