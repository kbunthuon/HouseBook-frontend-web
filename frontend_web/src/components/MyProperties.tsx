import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Search, ExternalLink, Edit, Key, BarChart3, Settings, ArrowRightLeft, Eye, CheckCircle, XCircle } from "lucide-react";
import { Property } from "../types/serverTypes";
import OldOwnerTransferDialog from "./OldOwnerTransferDialog";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../Routes";
import { apiClient } from "../api/wrappers";

interface MyPropertiesProps {
  ownerId: string;
  onViewProperty?: (propertyId: string) => void;
  onAddProperty?: () => void;
}

export function MyProperties({ ownerId: userID, onViewProperty, onAddProperty }: MyPropertiesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [transferProperties, setTransferProperties] = useState<
  {
      propertyId: string;
      name?: string;
      address?: string;
      currentOwners?: string[];
      invitedOwners: { email: string; firstName?: string; lastName?: string }[];
      createdAt: Date;
      status: "PENDING" | "APPROVED" | "REJECTED";
    }[]
  >([]);

  const navigate = useNavigate();

  const handleViewTransfer = (pid: string) => {
    if (!pid) return;
    navigate(ROUTES.propertyTransferPath(pid)); 
  };

  

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      const properties = await apiClient.getPropertyList(userID); 
      setMyProperties(properties || []);
      setLoading(false);
    };

    if (userID) {
      loadProperties();
    }
  }, [userID]);
  
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
        <div className="space-x-3">
        <Button onClick={() => setOpen(true)}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transfer Property
        </Button>
        <Button onClick={onAddProperty}>
          <Settings className="mr-2 h-4 w-4" />
          Add New Property
        </Button>
        </div>
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

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transfer Property List</CardTitle>
            <div className="flex items-center space-x-2">
              {/*
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search my properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              */ }
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transferProperties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Current Owner(s)</TableHead>
                  <TableHead>New Owner(s)</TableHead>
                  <TableHead>Created at</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferProperties.map((property) => (
                  <TableRow key={property.propertyId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.name}</div>
                        {property.address && (
                          <div className="text-sm text-muted-foreground">{property.address}</div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {property.currentOwners?.length
                        ? property.currentOwners.join(", ")
                        : "Unknown"}
                    </TableCell>

                    <TableCell>
                      {property.invitedOwners.map((owner, i) => (
                        <div key={i} className="text-sm">
                          {owner.firstName && owner.lastName
                            ? `${owner.firstName} ${owner.lastName}`
                            : owner.email}
                        </div>
                      ))}
                    </TableCell>

                    <TableCell>{property.createdAt.toLocaleString()}</TableCell>

                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          property.status === "PENDING"
                            ? "text-yellow-600"
                            : property.status === "APPROVED"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {property.status}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Property"
                          onClick={() => console.log("View", property.propertyId)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Approve"
                          onClick={() =>
                            setTransferProperties((prev) =>
                              prev.map((p) =>
                                p.propertyId === property.propertyId
                                  ? { ...p, status: "APPROVED" }
                                  : p
                              )
                            )
                          }
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Reject"
                          onClick={() =>
                            setTransferProperties((prev) =>
                              prev.map((p) =>
                                p.propertyId === property.propertyId
                                  ? { ...p, status: "REJECTED" }
                                  : p
                              )
                            )
                          }
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
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
                You haven’t initiated any property transfers yet.
              </div>
              <Button className="mt-4" onClick={() => setOpen(true)}>
                Transfer a Property
              </Button>
            </div>
          )}
        </CardContent>

      </Card>

      <OldOwnerTransferDialog
        open={open}
        onOpenChange={setOpen}
        userID={userID}
        onInitiateTransfer={(propertyId, invitedOwners, currentOwners) => {
          const property = myProperties.find((p) => p.propertyId === propertyId);
          setTransferProperties((prev) => [
            ...prev,
            {
              propertyId,
              name: property?.name ?? "Unknown Property",
              address: property?.address ?? "",
              invitedOwners,
              currentOwners: currentOwners.map((o) =>
                o.firstName && o.lastName ? `${o.firstName} ${o.lastName}` : o.email
              ),
              createdAt: new Date(),
              status: "PENDING",
            },
          ]);
        }}
      />

    </div>
  );
}