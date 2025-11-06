import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@ui/dialog";
import { Button } from "@ui/button";
import { X, Trash2 } from "lucide-react";

interface ImageDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  selectedImagesToDelete: string[];
  onToggleImage: (url: string) => void;
  onConfirm: () => void;
}

export default function ImageDeleteDialog({
  open,
  onOpenChange,
  images,
  selectedImagesToDelete,
  onToggleImage,
  onConfirm,
}: ImageDeleteDialogProps) {
  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delete Images/Videos</DialogTitle>
          <DialogDescription>Select media to delete from this property</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
          {images.map((url: string, idx: number) => (
            <div 
              key={idx} 
              className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedImagesToDelete.includes(url) 
                  ? 'border-destructive ring-2 ring-destructive' 
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              onClick={() => onToggleImage(url)}
            >
              {isVideo(url) ? (
                <video
                  src={url}
                  className="w-full h-48 object-cover"
                  muted
                />
              ) : (
                <img
                  src={url}
                  alt={`Image ${idx + 1}`}
                  className="w-full h-48 object-cover"
                />
              )}
              {selectedImagesToDelete.includes(url) && (
                <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                  <div className="bg-destructive text-white rounded-full p-2">
                    <Trash2 className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
            disabled={selectedImagesToDelete.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {selectedImagesToDelete.length > 0 && `(${selectedImagesToDelete.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}