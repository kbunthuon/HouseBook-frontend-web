import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { ROUTES } from "../Routes";
import { apiClient } from "../api/wrappers";
import { Owner } from "../types/serverTypes";

interface OldOwnerTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userID: string;
  onViewTransfer?: (propertyId: string) => void;
}

interface InvitedOwner {
  email: string;
  exists: boolean;
  userId?: string;
  firstName?: string;
  lastName?: string;
}

export default function OldOwnerTransferDialog({
  open,
  onOpenChange,
  userID,
  onViewTransfer
}: OldOwnerTransferDialogProps) {
  const [propertyId, setPropertyId] = React.useState<string>("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [checkingEmail, setCheckingEmail] = React.useState(false);
  const [emailExists, setEmailExists] = React.useState<boolean | null>(null);
  const [checkedUserId, setCheckedUserId] = React.useState<string | null>(null);
  const [invitedOwners, setInvitedOwners] = React.useState<InvitedOwner[]>([]);
  const [currentOwners, setCurrentOwners] = React.useState<InvitedOwner[]>([]);
  const [loadingOwners, setLoadingOwners] = React.useState(false);

  const [myProperties, setMyProperties] = useState<{ id: string; name: string }[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Fetch user's properties
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        if (!userID) {
          setMyProperties([]);
          setLoadingProperties(false);
          return;
        }
        const props = await apiClient.getPropertyList(userID);
        if (props && Array.isArray(props)) {
          setMyProperties(props.map((p) => ({ id: p.propertyId, name: p.name })));
        } else {
          setMyProperties([]);
        }
      } catch (e) {
        setMyProperties([]);
      }
      setLoadingProperties(false);
    };
    fetchProperties();
  }, [userID]);

  // Fetch current owners whenever propertyId changes
  useEffect(() => {
    const fetchCurrentOwners = async () => {
      if (!propertyId) {
        setCurrentOwners([]);
        return;
      }

      setLoadingOwners(true);
      setCurrentOwners([]); // Reset the list

      try {
        const owners: Owner[] = await apiClient.getPropertyOwners(propertyId);
        
        // Process owners sequentially
        const ownersList: InvitedOwner[] = [];
        for (const owner of owners) {
          try {
            const userInfo = await apiClient.getUserInfoByEmail(owner.email);
            
            if (userInfo && userInfo.userId) {
              ownersList.push({
                email: owner.email,
                exists: true,
                userId: userInfo.userId,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName
              });
            }
          } catch (error) {
            console.log(`Unable to fetch info for owner: ${owner.email}`);
          }
        }
        
        setCurrentOwners(ownersList);
      } catch (error) {
        console.error("Error fetching property owners:", error);
        toast.error("Error loading current owners");
      } finally {
        setLoadingOwners(false);
      }
    };

    fetchCurrentOwners();
  }, [propertyId]);

  const baseUrl = "https://house-book-frontend-web.vercel.app/";
  const transferLink = propertyId
    ? new URL(ROUTES.propertyTransferPath(propertyId), baseUrl).toString()
    : "";

  const copyLink = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const checkEmail = async () => {
    if (!validEmail(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if email is already in the invited list
    if (invitedOwners.some(owner => owner.email === inviteEmail)) {
      toast.error("This email has already been added to invited owners");
      return;
    }

    // Check if email is already a current owner
    if (currentOwners.some(owner => owner.email === inviteEmail)) {
      toast.error("This user is already an owner of this property");
      return;
    }

    setCheckingEmail(true);

    try {
      const userInfo = await apiClient.getUserInfoByEmail(inviteEmail);
      
      if (userInfo && userInfo.userId) {
        // User found - automatically add them
        const newOwner: InvitedOwner = {
          email: inviteEmail,
          exists: true,
          userId: userInfo.userId,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName
        };

        setInvitedOwners([...invitedOwners, newOwner]);
        toast.success(`${userInfo.firstName} ${userInfo.lastName} added to the list`);
        
        // Reset form
        setInviteEmail("");
        setEmailExists(null);
        setCheckedUserId(null);
      } else {
        setEmailExists(false);
        toast.error("No user found with this email address");
      }
    } catch (error: any) {
      if (error.message === "User not found" || error.message.includes("User not found")) {
        toast.error("No user found with this email address");
      } else {
        toast.error("Error checking email. Please try again.");
      }
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const addOwner = async () => {
    if (!emailExists || !inviteEmail) return;

    try {
      const userInfo = await apiClient.getUserInfoByEmail(inviteEmail);
      
      if (!userInfo || !userInfo.userId) {
        toast.error("Unable to add owner. Please try again.");
        return;
      }

      const newOwner: InvitedOwner = {
        email: inviteEmail,
        exists: true,
        userId: userInfo.userId,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName
      };

      setInvitedOwners([...invitedOwners, newOwner]);
      toast.success(`${userInfo.firstName} ${userInfo.lastName} added to the list`);
      
      // Reset form
      setInviteEmail("");
      setEmailExists(null);
      setCheckedUserId(null);
    } catch (error) {
      toast.error("Error adding owner. Please try again.");
    }
  };

  const removeOwner = (email: string) => {
    setInvitedOwners(invitedOwners.filter(owner => owner.email !== email));
    toast.success(`${email} removed from the list`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Initiate Property Transfer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4">
          {/* Select Property */}
          <div>
            <Label>Select Property</Label>
            <Select value={propertyId || undefined} onValueChange={setPropertyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>

              <SelectContent>
                {myProperties.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingProperties && myProperties.length === 0 && (
              <p className="text-sm text-muted-foreground">No properties found for {userID ?? "this user"}.</p>
            )}
          </div>

          {/* Current Owners */}
          {propertyId && (
            <div>
              <Label>Current Owners</Label>
              {loadingOwners ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading owners...</span>
                </div>
              ) : currentOwners.length > 0 ? (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/20">
                  {currentOwners.map((owner, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-background p-2 rounded"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {owner.firstName && owner.lastName 
                            ? `${owner.firstName} ${owner.lastName}`
                            : owner.email}
                        </span>
                        {owner.firstName && owner.lastName && (
                          <span className="text-xs text-muted-foreground">{owner.email}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">No current owners found.</p>
              )}
            </div>
          )}

          <Separator />

          {/* Invite owners with email validation */}
          <div>
            <Label>Invite New Owners</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Enter email address" 
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setEmailExists(null);
                    setCheckedUserId(null);
                  }}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={checkEmail}
                  disabled={!validEmail(inviteEmail) || checkingEmail || !propertyId}
                  className="px-4"
                >
                  {checkingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking
                    </>
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>

              {/* Email validation feedback */}
              {emailExists === false && (
                <p className="text-sm text-red-600">
                  No user found with this email address.
                </p>
              )}
              {!propertyId && (
                <p className="text-sm text-muted-foreground">
                  Please select a property first.
                </p>
              )}
            </div>
          </div>

          {/* List of invited owners */}
          {invitedOwners.length > 0 && (
            <div>
              <Label>New Owners to Add ({invitedOwners.length})</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {invitedOwners.map((owner, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between bg-muted/40 p-2 rounded"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {owner.firstName && owner.lastName 
                          ? `${owner.firstName} ${owner.lastName}`
                          : owner.email}
                      </span>
                      {owner.firstName && owner.lastName && (
                        <span className="text-xs text-muted-foreground">{owner.email}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOwner(owner.email)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* How to transfer */}
        <div className="rounded-lg bg-muted/40 p-4">
          <p className="font-semibold mb-2">How to transfer:</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Select a property to view its current owners.</li>
            <li>Enter email addresses and add new owners to the list.</li>
            <li>Click "Send Invitations" to notify new owners.</li>
            <li>New owners will receive an inbox message to accept the property transfer request.</li>
            <li>You'll receive a notification to approve or reject the property transfer request.</li>
          </ol>
        </div>

        {/* 
        <div className="flex gap-2 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewTransfer?.(propertyId)}   
            disabled={!propertyId}                        
            title="View Property Details"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Property
          </Button>
        </div>
        */}
      </DialogContent>
    </Dialog>
  );
}