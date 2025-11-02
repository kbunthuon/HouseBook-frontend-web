import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@ui/alert-dialog";
import { Search, ExternalLink, Edit, Key, BarChart3, Settings, ArrowRightLeft, Eye, CheckCircle, XCircle } from "lucide-react";
import OldOwnerTransferDialog from "@features/owner/components/OldOwnerTransferDialog";
import { apiClient } from "@shared/api/wrappers";
import { toast } from "sonner";
import { useProperties, useOwnerTransfers, useApproveTransfer, useRejectTransfer, queryKeys } from "@hooks/useQueries";
import { Property } from "@housebookgroup/shared-types";

interface MyPropertiesProps {
  ownerId: string;
  onViewProperty?: (propertyId: string) => void;
  onAddProperty?: () => void;
}

// Transfer-related interfaces
interface TransferOwnerInfo {
  email: string;
  firstName?: string;
  lastName?: string;
  acceptStatus: string;
  userId?: string;
  ownerId?: string;
}

interface TransferProperty {
  propertyId: string;
  name: string;
  address?: string;
  currentOwners: TransferOwnerInfo[];
  invitedOwners: TransferOwnerInfo[];
  createdAt: Date;
  transferStatus: string;
  userStatus: string;
  transferId: string;
}

interface TransferApiOwner {
  email: string;
  firstName?: string;
  lastName?: string;
  acceptStatus: string;
  userId?: string;
  ownerId?: string;
}

interface TransferApiResponse {
  propertyId: string;
  propertyName: string;
  propertyAddress?: string;
  oldOwners: TransferApiOwner[];
  newOwners: TransferApiOwner[];
  transferCreatedAt: string;
  transferStatus: string;
  transferId: string;
}

export function MyProperties({ ownerId: userID, onViewProperty, onAddProperty }: MyPropertiesProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; transferId: string; propertyName: string } | null>(null);

  // React Query hooks - fetch data automatically and in parallel
  const { data: myProperties = [], isLoading: propertiesLoading } = useProperties(userID);
  const { data: transferData, isLoading: transfersLoading } = useOwnerTransfers(userID);
  const approveTransferMutation = useApproveTransfer();
  const rejectTransferMutation = useRejectTransfer();

  // Map transfer data to the format expected by the component
  const transferProperties = useMemo((): TransferProperty[] => {
    if (!transferData || !transferData.transfers) return [];

    return transferData.transfers.map((t: TransferApiResponse): TransferProperty => ({
      propertyId: t.propertyId,
      name: t.propertyName,
      address: t.propertyAddress,
      currentOwners: (t.oldOwners || []).map((o: TransferApiOwner): TransferOwnerInfo => ({
        email: o.email,
        firstName: o.firstName,
        lastName: o.lastName,
        acceptStatus: o.acceptStatus,
        userId: o.userId,
        ownerId: o.ownerId,
      })),
      invitedOwners: (t.newOwners || []).map((o: TransferApiOwner): TransferOwnerInfo => ({
        email: o.email,
        firstName: o.firstName,
        lastName: o.lastName,
        acceptStatus: o.acceptStatus,
        userId: o.userId,
        ownerId: o.ownerId,
      })),
      createdAt: new Date(t.transferCreatedAt),
      transferStatus: t.transferStatus,
      userStatus:
        t.oldOwners?.find((o: TransferApiOwner) => o.userId === userID)?.acceptStatus ||
        t.newOwners?.find((o: TransferApiOwner) => o.userId === userID)?.acceptStatus ||
        "PENDING",
      transferId: t.transferId,
    }));
  }, [transferData, userID]);

  const loading = propertiesLoading || transfersLoading;

  const filteredProperties = useMemo((): Property[] =>
    myProperties.filter((property: Property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [myProperties, searchTerm]
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

  const handleApproveClick = (transferId: string, propertyName: string) => {
    setConfirmAction({ type: 'approve', transferId, propertyName });
    setConfirmDialogOpen(true);
  };

  const handleRejectClick = (transferId: string, propertyName: string) => {
    setConfirmAction({ type: 'reject', transferId, propertyName });
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      // Get owner ID from user ID
      const ownerId = await apiClient.getOwnerId(userID);

      if (confirmAction.type === 'approve') {
        await approveTransferMutation.mutateAsync({ transferId: confirmAction.transferId, ownerId });
        toast.success("Transfer approved successfully");
      } else {
        await rejectTransferMutation.mutateAsync({ transferId: confirmAction.transferId, ownerId });
        toast.success("Transfer rejected");
      }

      // React Query will automatically refetch transfers via mutation invalidation
    } catch (err) {
      const error = err as Error;
      console.error("Failed to process transfer:", error);
      toast.error(error.message || "Failed to process transfer");
    } finally {
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
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
              {myProperties.filter((p: Property) => p.status === "Active").length}
            </div>
            <div className="text-sm text-muted-foreground">Active Properties</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round(myProperties.reduce((acc: number, p: Property) => acc + p.completionStatus, 0) / myProperties.length) || 0}%
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
            <div className="overflow-x-auto">
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
                {filteredProperties.map((property: Property) => (
                  <TableRow key={property.propertyId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.name}</div>
                        <div className="text-sm text-muted-foreground">{property.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>{property.type}</TableCell>
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
            </div>
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[50vh] overflow-y-auto">
          {transferProperties.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Current Owner(s)</TableHead>
                    <TableHead>New Owner(s)</TableHead>
                    <TableHead>Created at</TableHead>
                    <TableHead>Transfer Status</TableHead>
                    <TableHead>Your Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {transferProperties.map((property: TransferProperty) => (
                  <TableRow key={property.transferId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.name}</div>
                        {property.address && (
                          <div className="text-sm text-muted-foreground">{property.address}</div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {property.currentOwners.map((owner, i) => (
                        <div key={i} className="text-sm">
                          {owner.firstName && owner.lastName
                            ? `${owner.firstName} ${owner.lastName}`
                            : owner.email}
                        </div>
                      ))}
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
                          property.transferStatus === "PENDING"
                            ? "text-yellow-600"
                            : property.transferStatus === "ACCEPTED"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {property.transferStatus}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          property.userStatus === "PENDING"
                            ? "text-yellow-600"
                            : property.userStatus === "ACCEPTED"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {property.userStatus}
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
                          onClick={() => handleApproveClick(property.transferId, property.name)}
                          disabled={property.userStatus !== "PENDING" || property.transferStatus !== "PENDING"}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Reject"
                          onClick={() => handleRejectClick(property.transferId, property.name)}
                          disabled={property.userStatus !== "PENDING" || property.transferStatus !== "PENDING"}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                You haven't initiated any property transfers yet.
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
        onInitiateTransfer={async (propertyId, allOldOwnerIds, newOwnerStateIds) => {
          try {
            console.log("Initiating transfer for property:", propertyId, allOldOwnerIds, newOwnerStateIds);
            await apiClient.initiateTransfer(propertyId, allOldOwnerIds, newOwnerStateIds);

            // React Query will automatically refetch transfers and properties
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            queryClient.invalidateQueries({ queryKey: queryKeys.properties });

            setOpen(false);
          } catch (err) {
            console.error("Failed to initiate transfer:", err);
          }
        }}
      />

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'approve' ? 'Approve Transfer' : 'Reject Transfer'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'approve'
                ? `Are you sure you want to approve the transfer for "${confirmAction.propertyName}"? This action cannot be undone once all parties approve.`
                : `Are you sure you want to reject the transfer for "${confirmAction?.propertyName}"? This will cancel the entire transfer process for all parties.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmDialogOpen(false);
              setConfirmAction(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}