import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { Copy, Send, ExternalLink } from "lucide-react";
import { ROUTES } from "../Routes";
import { Link } from "react-router-dom";
import { apiClient } from "../api/wrappers";
interface OldOwnerTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userID: string;
  //onSendEmail?: (args: { email: string; propertyId: string; link: string }) => Promise<void> | void;
  onViewTransfer?: (propertyId: string) => void;
}

export default function OldOwnerTransferDialog({
  open,
  onOpenChange,
  userID,
  //onSendEmail
  onViewTransfer
}: OldOwnerTransferDialogProps) {
  const [propertyId, setPropertyId] = React.useState<string>("");
  const [email, setEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const [myProperties, setMyProperties] = useState<{ id: string; name: string }[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        if (!userID) {
          setMyProperties([]);
          setLoadingProperties(false);
          return;
        }
        // Fetch properties from backend
        const props = await apiClient.getPropertyList(userID);
        if (props && Array.isArray(props)) {
          setMyProperties(props.map((p) => ({ id: p.property_id, name: p.name })));
        } else {
          setMyProperties([]);
        }
      } catch (e) {
        setMyProperties([]);
      }
      setLoadingProperties(false);
    };
    fetchProperties();
    console.log("properties: ", {myProperties})
    console.log("userID: ", {userID})
  }, [userID]);

  // In real life you’d fetch/generate a server key.
  //const transferKey = React.useMemo(() => crypto.randomUUID(), [propertyId]);
  // const baseUrl = "https://housebook.com/property-transfer"
  // const transferLink = propertyId ? `${baseUrl}/${propertyId}/` : "";
  const baseUrl = "https://house-book-frontend-web.vercel.app/";
  const transferLink = propertyId
    ? new URL(ROUTES.propertyTransferPath(propertyId), baseUrl).toString()
    : "";
  // -> "https://house-book-frontend-web.vercel.app/owner/properties/abc123"

  // const submittedLink = propertyId
  // ? new URL(ROUTES.propertyTransferSubmittedPath(propertyId), baseUrl).toString()
  // : "";

  // const handleOpen = () => {
  //   if (!link) return;
  //   window.open(link, "_blank", "noopener,noreferrer");
  // };
  console.log({
    pattern: ROUTES.propertyTransfer,
    link: ROUTES.propertyTransferPath(propertyId),
    propertyId,
  });

  const copyLink = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("PIN copied to clipboard");
    } catch {
      toast.error("Failed to copy PIN");
    }
  };

  // const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // const handleSend = async () => {
  //   if (!propertyId || !validEmail(email)) return;
  //   try {
  //     setSending(true);
  //     await onSendEmail?.({ email, propertyId, link: transferLink });
  //   } finally {
  //     setSending(false);
  //   }
  // };

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Control width here */}
      <DialogContent className="w-full sm:w-[400px]">
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

        {/* Transfer Link with copy */}
        <div>
          <Label>Property Transfer Link</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={transferLink} className="flex-1" />
            <Button type="button" variant="secondary" onClick={copyLink} aria-label="Copy link">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        </div>

        {/* Email + Send
        <div className="space-y-2">
          <Label>Send Request Link to New Owner</Label>
          <div className="flex items-center gap-3">
            <Input
              placeholder="admin@housebook.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={!propertyId || !validEmail(email) || sending}
              className="px-5"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
          {!validEmail(email) && email.length > 0 && (
            <p className="text-xs text-destructive">Please enter a valid email address.</p>
          )}
        </div> */}

        <Separator className="my-2" />

        {/* How to transfer */}
        <div className="rounded-lg bg-muted/40 p-4">
          <p className="font-semibold mb-2">How to transfer:</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
            <li>1. Send the link to the new property owner.</li>
            <li>2. The new owner will receive an inbox message to click the property transfer request.</li>
            <li>3. You’ll receive a notification to approve or reject the property transfer request.</li>
          </ol>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewTransfer?.(propertyId)}   
          disabled={!propertyId}                        
          title="View Property Details"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        

      </DialogContent>
    </Dialog>
  );
}


