import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Search, ExternalLink, Edit, Key, BarChart3, Settings } from "lucide-react";

interface MyPropertiesProps {
  ownerEmail: string;
  onViewProperty?: (propertyId: string) => void;
  onAddProperty?: () => void;
}

export function MyProperties({ ownerEmail, onViewProperty, onAddProperty }: MyPropertiesProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data filtered by owner - in real app this would come from API
  const getMyProperties = () => {
    if (ownerEmail.includes('john') || ownerEmail.includes('smith')) {
      return [
        {
          id: "1",
          name: "Rose Wood Retreat",
          address: "123 Maple Street, Downtown",
          type: "Single Family Home",
          status: "Active",
          pin: "123456",
          lastUpdated: "2 days ago",
          completionStatus: 95
        },
        {
          id: "5", 
          name: "Sunset Villa",
          address: "567 Sunset Boulevard, Hillside",
          type: "Luxury Villa",
          status: "Active",
          pin: "567890",
          lastUpdated: "1 week ago",
          completionStatus: 88
        }
      ];
    } else if (ownerEmail.includes('sarah')) {
      return [
        {
          id: "2",
          name: "Riverside Apartments",
          address: "456 River Road, Riverside",
          type: "Apartment Complex",
          status: "Active",
          pin: "789012",
          lastUpdated: "1 week ago",
          completionStatus: 92
        }
      ];
    } else {
      return [
        {
          id: "3",
          name: "Oak Grove Complex",
          address: "789 Oak Avenue, Westside",
          type: "Mixed Use",
          status: "Pending",
          pin: "345678",
          lastUpdated: "3 days ago",
          completionStatus: 67
        }
      ];
    }
  };

  const myProperties = getMyProperties();
  
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
                  <TableHead>Status</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.name}</div>
                        <div className="text-sm text-muted-foreground">{property.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>{property.type}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(property.status)}>
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getCompletionColor(property.completionStatus)}`}>
                          {property.completionStatus}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{property.lastUpdated}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {onViewProperty && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewProperty(property.id)}
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