import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@ui/dialog";
import { Card, CardContent } from "@ui/card";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { History } from "lucide-react";
import { ChangeLog } from "@shared/types/serverTypes";

interface ChangeLogTimelineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  history: ChangeLog[];
  showSpacesAndAssetBadges?: boolean;
}

const formatSpecifications = (specs: Record<string, any> | undefined) => {
  if (!specs || typeof specs !== 'object') return null;
  return Object.entries(specs).map(([key, value]) => (
    <div key={key} className="text-sm flex justify-between items-center">
      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
      <span className="text-muted-foreground">{String(value)}</span>
    </div>
  ));
};

export default function ChangeLogTimeline({ open, onOpenChange, title = 'History', history, showSpacesAndAssetBadges = false }: ChangeLogTimelineProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[1200px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center mb-4">
            <History className="h-5 w-5 mr-2" />{title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No history available</p>
          ) : (
            history.map((item) => (
              <Card key={item.id} className={`border-l-4 ${item.actions === 'DELETED' ? 'border-l-destructive' : 'border-l-primary/50'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={item.actions === 'DELETED' ? 'destructive' : item.actions === 'CREATED' ? 'default' : 'secondary'}>
                        {item.actions}
                      </Badge>
                      {showSpacesAndAssetBadges && (
                        <>
                          <Badge variant="outline">{(item as any).Assets?.Spaces?.name}</Badge>
                          <Badge variant="secondary">{(item as any).Assets?.AssetTypes?.name}</Badge>
                        </>
                      )}
                      {!showSpacesAndAssetBadges && (
                        <Badge variant="outline">{(item as any).Assets?.AssetTypes?.name}</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                  </div>

                  <p className="text-sm mb-2">{item.changeDescription}</p>

                  {item.specifications && Object.keys(item.specifications).length > 0 && (
                    <div className="mt-2 p-3 bg-muted/50 rounded space-y-1">
                      {formatSpecifications(item.specifications)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
