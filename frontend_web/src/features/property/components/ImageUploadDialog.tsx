import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@ui/dialog";
import { Button } from "@ui/button";
import { Plus, X, Save } from "lucide-react";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFiles: File[];
  onFilesSelected: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onConfirm: () => void;
}

export default function ImageUploadDialog({
  open,
  onOpenChange,
  selectedFiles,
  onFilesSelected,
  onRemoveFile,
  onConfirm,
}: ImageUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
          <DialogDescription>Select images to upload to this property</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => onFilesSelected(e.target.files)}
            className="hidden"
          />
          
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Choose Images
          </Button>
          
          {selectedFiles.length > 0 ? (
            <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative border rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => onRemoveFile(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="p-2 bg-muted">
                    <p className="text-xs truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
              No images selected
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={selectedFiles.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}