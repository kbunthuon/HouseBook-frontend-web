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
import { UserCog, ArrowRightLeft, Eye, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { useState, useEffect} from "react";
import { getOwnerId, getProperty, Property, getPropertyImages, getChangeLogs } from "../../../backend/FetchData.ts";
import supabase from "../../../config/supabaseClient.ts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";


interface DashboardProps {
  userId: string;
}


interface ChangeLog {
  property_id: string;
  changelog_id: string;
  changelog_specifications: Record<string, any>;
  changelog_description: string;
  changelog_status: "ACCEPTED" | "DECLINED" | "PENDING";
  changelog_created_at: string;
  user_first_name: string | null;
  user_last_name: string | null;
}

export function Dashboard({ userId }: DashboardProps) {
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


  const metrics = [
    {
      title: "Active Properties",
      value: "24",
      change: "+12%",
      icon: Building,
      color: "text-blue-600"
    },
    {
      title: "Property Owners",
      value: "18",
      change: "+8%",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Reports Generated",
      value: "156",
      change: "+23%",
      icon: FileText,
      color: "text-purple-600"
    },
    {
      title: "Access Tokens",
      value: "47",
      change: "+15%",
      icon: Key,
      color: "text-orange-600"
    }
  ];

  // const recentActivity = [
  //   {
  //     id: 1,
  //     action: "Property onboarded",
  //     property: "Maple Heights Development",
  //     user: "John Smith",
  //     time: "2 hours ago",
  //     status: "completed"
  //   },
  //   {
  //     id: 2,
  //     action: "Access token updated",
  //     property: "Riverside Apartments",
  //     user: "Sarah Johnson",
  //     time: "4 hours ago",
  //     status: "completed"
  //   },
  //   {
  //     id: 3,
  //     action: "Report generated",
  //     property: "Oak Grove Complex",
  //     user: "Mike Wilson",
  //     time: "6 hours ago",
  //     status: "completed"
  //   },
  //   {
  //     id: 4,
  //     action: "Property transfer initiated",
  //     property: "Pine Valley Homes",
  //     user: "Admin",
  //     time: "1 day ago",
  //     status: "pending"
  //   }
  // ];

  return (
    <div className="space-y-8">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your property management system
        </p>
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
                <p className="text-xs text-muted-foreground">
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Properties Preview */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recently Onboarded Properties</CardTitle>
        {/* <Button size="sm" variant="outline" onClick={onAddProperty}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button> */}
      </CardHeader>

      <CardContent>
        {myProperties.length > 0 ? (
          <div className="overflow-x-auto py-4">
            <div className="flex gap-6 w-max">
              {myProperties.map((property) => (
                <div 
                  key={property.property_id} 
                  className="w-80 h-80 bg-gray-50 rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col cursor-pointer"
                  style={{ minWidth: '320px', maxWidth: '320px'}}
                  // onClick={() => onViewProperty && onViewProperty(property.property_id)}
                >
                  {/* property image */}
                  <div className="w-full flex-1 bg-muted flex items-center justify-center">
                    {property.splash_image ? (
                      <img
                        src={property.splash_image}
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
            {/* <Button className="mt-4" onClick={onAddProperty}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button> */}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* {auditLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">{entry.timestamp}</TableCell>
                      <TableCell>{entry.user}</TableCell>
                      <TableCell>{entry.action}</TableCell>
                      <TableCell>{entry.property}</TableCell>
                      <TableCell>
                        <Badge variant={getActionTypeColor(entry.type)}>
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.details}
                      </TableCell>
                    </TableRow>
                  ))} */}
                </TableBody>
              </Table>
              <h3 className="mt-4 text-lg font-medium"></h3>
                <p className="text-muted-foreground">
                  All recent property transfers and admin-related activity will be reported here.
                </p>
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
              <div className="text-center py-8">
                <UserCog className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">User Management</h3>
                <p className="text-muted-foreground">
                  All recent property transfers and admin-related activity will be reported here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      </CardContent>

    </Card>
    

    
            
        

      <div className="grid gap-4 md:grid-cols-2">
        {/* <Card>
          <CardHeader>
            <CardTitle>Onboarding Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Properties with Complete Data</span>
                <span>75%</span>
              </div>
              <Progress value={75} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Utility Information</span>
                <span>82%</span>
              </div>
              <Progress value={82} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Floor Plans Uploaded</span>
                <span>68%</span>
              </div>
              <Progress value={68} />
            </div>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {/* <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.property} • {activity.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                    {activity.status}
                  </Badge>
                </div> */}
              {/* ))}
            </div> */}
          {/* </CardContent> */}
        {/* </Card> } */}
      </div>
    </div>
  );
}
