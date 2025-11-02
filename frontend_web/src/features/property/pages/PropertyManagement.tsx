import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Badge } from "@ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ui/table";
import { Search, ExternalLink, Edit, Key, BarChart3, Settings } from "lucide-react";
// import { getProperty } from "@backend/FetchData";
import { Property } from "@shared/types/serverTypes";
import { apiClient } from "@shared/api/wrappers";
//import { getAdminProperty } from "@backend/FetchData";

interface PropertyManagementProps {
  userId: string;
  userType: string;
  onViewProperty?: (propertyId: string) => void;
  onAddProperty?: () => void;
}

export function PropertyManagement({ userId, userType, onViewProperty, onAddProperty }: PropertyManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperties = async () => {
      
      setLoading(true);


      const properties = await apiClient.getAdminProperties(userId, userType);
      // Remove duplicate properties by propertyId
      const uniquePropertiesMap = new Map();
      properties?.forEach((p: any) => {
        if (!uniquePropertiesMap.has(p.propertyId)) {
          uniquePropertiesMap.set(p.propertyId, p);
        }
      });
  
      const uniqueProperties = Array.from(uniquePropertiesMap.values());
      setMyProperties(uniqueProperties ?? []);
      
      console.log(uniqueProperties);
      setLoading(false);

    };

    if (userId) {
      loadProperties();
    }
  }, [userId]);
  
  const filteredProperties = myProperties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Pending":
        return "secondary";
      case "Transfer":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>My Properties</h1>
          <p className="text-muted-foreground">
            Manage your property portfolio
          </p>
        </div>
        <Button onClick={onAddProperty}>
          <Settings className="mr-2 h-4 w-4" />
          Add New Property
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{myProperties.length}</div>
            <div className="text-sm text-muted-foreground">Total Properties</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {myProperties.filter(p => p.status === "Active").length}
            </div>
            <div className="text-sm text-muted-foreground">Active Properties</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round(myProperties.reduce((acc, p) => acc + p.completionStatus, 0) / myProperties.length) || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Avg. Completion</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Property List</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search my properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProperties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  {/* <TableHead>Status</TableHead>
                  <TableHead>Completion</TableHead> */}
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.propertyId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.name}</div>
                        <div className="text-sm text-muted-foreground">{property.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>{property.type}</TableCell>
                    {/* <TableCell>
                      <Badge variant={getStatusColor(property.status)}>
                        {property.status}
                      </Badge>
                    </TableCell> */}
                    {/* <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getCompletionColor(property.completionStatus)}`}>
                          {property.completionStatus}%
                        </span>
                      </div>
                    </TableCell> */}
                    <TableCell>{new Date(property.lastUpdated).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {onViewProperty && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewProperty(property.propertyId)}
                            title="View Property Details"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" title="Edit Property">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Access Codes">
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Generate Report">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {searchTerm ? "No properties match your search." : "You haven't added any properties yet."}
              </div>
              {!searchTerm && onAddProperty && (
                <Button className="mt-4" onClick={onAddProperty}>
                  Add Your First Property
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}