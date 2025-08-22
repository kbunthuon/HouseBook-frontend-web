import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Building, Search, Eye, Edit, Key, Trash2, ExternalLink } from "lucide-react";

interface PropertyManagementProps {
  onViewProperty?: (propertyId: string) => void;
}

export function PropertyManagement({ onViewProperty }: PropertyManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const properties = [
    {
      id: "1",
      name: "Rose Wood Retreat",
      address: "123 Maple Street, Downtown",
      type: "Single Family Home",
      owner: "John Smith",
      units: 1,
      status: "Active",
      pin: "123456",
      token: "abc123def456",
      lastUpdated: "2 days ago"
    },
    {
      id: "2",
      name: "Riverside Apartments",
      address: "456 River Road, Riverside",
      type: "Residential",
      owner: "Sarah Johnson",
      units: 32,
      status: "Active",
      pin: "789012",
      token: "ghi789jkl012",
      lastUpdated: "1 week ago"
    },
    {
      id: "3",
      name: "Oak Grove Complex",
      address: "789 Oak Avenue, Westside",
      type: "Mixed Use",
      owner: "Mike Wilson",
      units: 68,
      status: "Pending",
      pin: "345678",
      token: "mno345pqr678",
      lastUpdated: "3 days ago"
    },
    {
      id: "4",
      name: "Pine Valley Homes",
      address: "321 Pine Valley Drive, Suburbs",
      type: "Residential",
      owner: "Lisa Brown",
      units: 28,
      status: "Transfer",
      pin: "901234",
      token: "stu901vwx234",
      lastUpdated: "5 days ago"
    }
  ];

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const regenerateAccessCodes = (propertyId: string) => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log(`Regenerated codes for property ${propertyId}: PIN: ${newPin}, Token: ${newToken}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Property Management</h1>
          <p className="text-muted-foreground">
            Manage your property portfolio
          </p>
        </div>
        <Button>
          <Building className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>{property.owner}</TableCell>
                  <TableCell>{property.type}</TableCell>
                  <TableCell>{property.units}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(property.status)}>
                      {property.status}
                    </Badge>
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProperty(property)}
                            title="Quick View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Property Overview</DialogTitle>
                          </DialogHeader>
                          {selectedProperty && (
                            <div className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label>Property Name</Label>
                                  <Input value={selectedProperty.name} readOnly />
                                </div>
                                <div>
                                  <Label>Owner</Label>
                                  <Input value={selectedProperty.owner} readOnly />
                                </div>
                              </div>
                              <div>
                                <Label>Address</Label>
                                <Input value={selectedProperty.address} readOnly />
                              </div>
                              <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                  <Label>Type</Label>
                                  <Input value={selectedProperty.type} readOnly />
                                </div>
                                <div>
                                  <Label>Units</Label>
                                  <Input value={selectedProperty.units} readOnly />
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Input value={selectedProperty.status} readOnly />
                                </div>
                              </div>
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label>Access PIN</Label>
                                  <div className="flex space-x-2">
                                    <Input value={selectedProperty.pin} readOnly />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => regenerateAccessCodes(selectedProperty.id)}
                                    >
                                      <Key className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <Label>Access Token</Label>
                                  <div className="flex space-x-2">
                                    <Input value={selectedProperty.token} readOnly />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => regenerateAccessCodes(selectedProperty.id)}
                                    >
                                      <Key className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {onViewProperty && (
                                <div className="flex justify-end mt-6">
                                  <Button onClick={() => onViewProperty(selectedProperty.id)}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Full Details
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" title="Edit Property">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Delete Property">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}