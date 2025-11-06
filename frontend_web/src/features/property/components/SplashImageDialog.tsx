import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@ui/dialog";
import { Button } from "@ui/button";
import { X, CheckCircle } from "lucide-react";

interface SplashImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  selectedSplashImage: string | null;
  onSelectImage: (url: string) => void;
  onConfirm: () => void;
}

export default function SplashImageDialog({
  open,
  onOpenChange,
  images,
  selectedSplashImage,
  onSelectImage,
  onConfirm,
}: SplashImageDialogProps) {
  const imageUrls = images.filter((url) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url.split("?")[0]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Splash Image</DialogTitle>
          <DialogDescription>Choose an image to use as the main property splash image</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {imageUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
              {imageUrls.map((imgUrl, idx) => (
                <div
                  key={imgUrl}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedSplashImage === imgUrl
                      ? 'border-primary ring-2 ring-primary'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => onSelectImage(imgUrl)}
                >
                  <img
                    src={imgUrl}
                    alt={`Property Image ${idx + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  {selectedSplashImage === imgUrl && (
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
            onClick={onConfirm}
            disabled={!selectedSplashImage}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Set as Splash Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}