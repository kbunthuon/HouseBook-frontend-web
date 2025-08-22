import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { UserCog, ArrowRightLeft, Eye, CheckCircle, XCircle, Clock } from "lucide-react";

export function AdminFunctions() {
  const [transferData, setTransferData] = useState({
    propertyId: "",
    currentOwner: "",
    newOwner: "",
    reason: ""
  });

  const pendingTransfers = [
    {
      id: 1,
      property: "Pine Valley Homes",
      currentOwner: "Lisa Brown",
      newOwner: "Green Development Co",
      requestDate: "2024-01-15",
      reason: "Company acquisition",
      status: "pending"
    },
    {
      id: 2,
      property: "Sunset Gardens",
      currentOwner: "Mike Wilson",
      newOwner: "Urban Properties Ltd",
      requestDate: "2024-01-12",
      reason: "Portfolio restructuring",
      status: "approved"
    }
  ];

  const auditLog = [
    {
      id: 1,
      timestamp: "2024-01-20 14:30",
      user: "john.smith@company.com",
      action: "Updated property utilities",
      property: "Maple Heights Development",
      details: "Updated electrical provider information",
      type: "update"
    },
    {
      id: 2,
      timestamp: "2024-01-20 12:15",
      user: "admin@housebook.com",
      action: "Approved property transfer",
      property: "Sunset Gardens",
      details: "Transfer approved to Urban Properties Ltd",
      type: "admin"
    },
    {
      id: 3,
      timestamp: "2024-01-19 16:45",
      user: "sarah.johnson@dev.com",
      action: "Added new property",
      property: "Riverside Apartments",
      details: "Completed onboarding process",
      type: "create"
    },
    {
      id: 4,
      timestamp: "2024-01-19 10:20",
      user: "mike.wilson@properties.com",
      action: "Updated access codes",
      property: "Oak Grove Complex",
      details: "Regenerated PIN and access token",
      type: "security"
    }
  ];

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Transfer request submitted:", transferData);
    // Reset form
    setTransferData({
      propertyId: "",
      currentOwner: "",
      newOwner: "",
      reason: ""
    });
  };

  const approveTransfer = (transferId: number) => {
    console.log(`Approved transfer ${transferId}`);
  };

  const rejectTransfer = (transferId: number) => {
    console.log(`Rejected transfer ${transferId}`);
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "admin":
        return "destructive";
      case "security":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTransferStatusColor = (status: string) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1>Admin Functions</h1>
        <p className="text-muted-foreground">
          Administrative controls and oversight
        </p>
      </div>

      <Tabs defaultValue="transfers" className="w-full">
        <TabsList>
          <TabsTrigger value="transfers">Property Transfers</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="transfers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowRightLeft className="mr-2 h-5 w-5" />
                  Initiate Property Transfer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="propertyId">Property</Label>
                    <Select onValueChange={(value) => setTransferData({...transferData, propertyId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Maple Heights Development</SelectItem>
                        <SelectItem value="2">Riverside Apartments</SelectItem>
                        <SelectItem value="3">Oak Grove Complex</SelectItem>
                        <SelectItem value="4">Pine Valley Homes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currentOwner">Current Owner</Label>
                    <Input
                      id="currentOwner"
                      value={transferData.currentOwner}
                      onChange={(e) => setTransferData({...transferData, currentOwner: e.target.value})}
                      placeholder="Current owner name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newOwner">New Owner</Label>
                    <Input
                      id="newOwner"
                      value={transferData.newOwner}
                      onChange={(e) => setTransferData({...transferData, newOwner: e.target.value})}
                      placeholder="New owner name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason for Transfer</Label>
                    <Textarea
                      id="reason"
                      value={transferData.reason}
                      onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                      placeholder="Explain the reason for this transfer..."
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Submit Transfer Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transfer Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Pending Transfers</span>
                  <Badge variant="secondary">2</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed This Month</span>
                  <Badge variant="default">5</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Processing Time</span>
                  <span className="text-sm text-muted-foreground">3.2 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Success Rate</span>
                  <span className="text-sm text-muted-foreground">94%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Transfer Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Current Owner</TableHead>
                    <TableHead>New Owner</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.property}</TableCell>
                      <TableCell>{transfer.currentOwner}</TableCell>
                      <TableCell>{transfer.newOwner}</TableCell>
                      <TableCell>{transfer.requestDate}</TableCell>
                      <TableCell>
                        <Badge variant={getTransferStatusColor(transfer.status)}>
                          {transfer.status}
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
                                <DialogTitle>Transfer Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Property</Label>
                                  <Input value={transfer.property} readOnly />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label>Current Owner</Label>
                                    <Input value={transfer.currentOwner} readOnly />
                                  </div>
                                  <div>
                                    <Label>New Owner</Label>
                                    <Input value={transfer.newOwner} readOnly />
                                  </div>
                                </div>
                                <div>
                                  <Label>Reason</Label>
                                  <Textarea value={transfer.reason} readOnly />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => rejectTransfer(transfer.id)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                  <Button onClick={() => approveTransfer(transfer.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {transfer.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveTransfer(transfer.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => rejectTransfer(transfer.id)}
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
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Log</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track all system activities and changes
              </p>
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
                  {auditLog.map((entry) => (
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
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
                  User management features would be implemented here, including user roles, permissions, and account management.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}