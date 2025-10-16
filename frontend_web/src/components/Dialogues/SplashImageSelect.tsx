import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { CheckCircle, ImageIcon, X } from "lucide-react";
import { Property } from "../../types/serverTypes";
import { apiClient } from "../../api/wrappers";

interface SplashImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onSplashImageSet?: (newUrl: string) => void;
}

export default function SplashImageDialog({
  open,
  onOpenChange,
  property,
  onSplashImageSet,
}: SplashImageDialogProps) {
  const [selectedSplash, setSelectedSplash] = useState<string | null>(
    property?.splashImage || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectImage = (url: string) => {
    setSelectedSplash((prev) => (prev === url ? null : url));
  };

  const handleConfirm = async () => {
    if (!selectedSplash) return;

    try {
      setIsSubmitting(true);
      const result = await apiClient.updatePropertySplashImage(selectedSplash);

      if (result?.result) {
        onSplashImageSet?.(selectedSplash);
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Failed to set splash image:", err);
      alert("Failed to update splash image.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Splash Image</DialogTitle>
          <DialogDescription>
            Choose one image to use as the splash image for this property.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {property?.images && property.images.length > 0 ? (
            <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
              {property.images.map((url, idx) => (
                <div
                  key={idx}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedSplash === url
                      ? "border-primary ring-2 ring-primary"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  onClick={() => handleSelectImage(url)}
                >
                  <img
                    src={url}
                    alt={`Property Image ${idx + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  {selectedSplash === url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-white rounded-full p-2">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <ImageIcon className="mx-auto h-10 w-10 mb-2 opacity-60" />
              No images available
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSplash || isSubmitting}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isSubmitting ? "Setting..." : "Set as Splash Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
