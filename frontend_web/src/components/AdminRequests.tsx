import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";
import { Badge } from "./ui/badge.tsx";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";
import { Button } from "./ui/button.tsx";
import { Building, FileText, Key, Plus, TrendingUp, Calendar } from "lucide-react";
import { UserCog, ArrowRightLeft, Eye, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { useMemo } from "react";
import { Property } from "@housebookgroup/shared-types";
import { ChangeLogWithUser } from "../hooks/useQueries.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useAdminProperties, useChangeLogs, useApproveEdit, useRejectEdit } from "../hooks/useQueries.ts";

interface AdminRequestProps {
  userId: string;
  userType: string;
}

export function AdminRequests({ userId, userType}: AdminRequestProps) {
  // React Query hooks for data fetching
  const { data: myProperties = [], isLoading: propertiesLoading } = useAdminProperties(userId, userType);

  // Get property IDs for changelog query
  const propertyIds = useMemo(() => {
    return myProperties.map((p: Property) => p.propertyId);
  }, [myProperties]);

  const { data: requests = [], isLoading: requestsLoading } = useChangeLogs(propertyIds);

  // Mutations for approve/reject
  const approveEditMutation = useApproveEdit();
  const rejectEditMutation = useRejectEdit();

  const loading = propertiesLoading || requestsLoading;

  const approveEdit = async (id: string) => {
    try {
      await approveEditMutation.mutateAsync(id);
      console.log(`Approved edit ${id}`);
    } catch (error) {
      console.error("Error approving edit:", error);
    }
  };

  const rejectEdit = async (id: string) => {
    try {
      await rejectEditMutation.mutateAsync(id);
      console.log(`Rejected edit ${id}`);
    } catch (error) {
      console.error("Error rejecting edit:", error);
    }
  };

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
        <h1>Requests</h1>
        <p className="text-muted-foreground">
          All requests are displayed here.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
            <CardHeader>
              <CardTitle>All Edit Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-y-auto border rounded-lg">
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
                  {requests.map((request) => (
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
                                  <Input value={myProperties.find(
                                  (p) => p.propertyId === request.propertyId)?.address ?? "Unknown Property"} readOnly />
                                </div>
                                <div className="grid gap-4 md:grid-cols-1">
                                  <div>
                                    <Label>Requested By</Label>
                                    <Input value={`${request.userFirstName ?? ""} ${request.userLastName ?? ""}`} readOnly />
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
                                  <td className="px-4 py-2">
                                    <ul className="text-xs space-y-1">
                                      {Object.entries(request.specifications??{}).map(([key, value]) => (
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
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}