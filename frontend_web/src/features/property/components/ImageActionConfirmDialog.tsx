import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@ui/alert-dialog";

interface ImageActionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'upload' | 'delete' | 'setSplash' | null;
  selectedFilesCount?: number;
  selectedImagesToDeleteCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ImageActionConfirmDialog({
  open,
  onOpenChange,
  action,
  selectedFilesCount = 0,
  selectedImagesToDeleteCount = 0,
  onConfirm,
  onCancel,
}: ImageActionConfirmDialogProps) {
  const getTitle = () => {
    switch (action) {
      case 'upload':
        return 'Confirm Image Upload';
      case 'delete':
        return 'Confirm Image Deletion';
      case 'setSplash':
        return 'Confirm Splash Image Change';
      default:
        return 'Confirm Action';
    }
  };

  const getDescription = () => {
    switch (action) {
      case 'upload':
        return `Are you sure you want to upload ${selectedFilesCount} image(s)?`;
      case 'delete':
        return `Are you sure you want to delete ${selectedImagesToDeleteCount} image(s)? This action cannot be undone.`;
      case 'setSplash':
        return 'Are you sure you want to set the selected image as the new property splash image?';
      default:
        return 'Are you sure you want to proceed with this action?';
    }
  };

  const getActionButtonText = () => {
    switch (action) {
      case 'upload':
        return 'Upload';
      case 'delete':
        return 'Delete';
      case 'setSplash':
        return 'Set Splash Image';
      default:
        return 'Confirm';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {getActionButtonText()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}