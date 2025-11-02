import React from 'react';
import { Button } from '@ui/button';
import { Trash2, Edit } from 'lucide-react';

export default function AssetCard({
  asset,
  onEdit,
  onDelete,
  onDeleteFeature,
}: {
  asset: any;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteFeature: (featureName: string) => void;
}) {
  return (
    <div key={asset.id} className="border rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">{asset.assetTypes?.name}</span>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
          {asset.description && (
            <p className="text-sm text-muted-foreground mb-2">{asset.description}</p>
          )}
        </div>
      </div>

      {asset.currentSpecifications && Object.keys(asset.currentSpecifications).length > 0 ? (
        <div className="space-y-1 bg-muted/30 p-2 rounded">
          {Object.entries(asset.currentSpecifications).map(([key, value]) => (
            <div key={key} className="text-sm flex justify-between items-center group">
              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">{String(value)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                  onClick={() => onDeleteFeature(key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No specifications</p>
      )}
    </div>
  );
}
