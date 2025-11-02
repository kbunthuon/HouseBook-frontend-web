import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@ui/card';
import { Button } from '@ui/button';
import { History, Plus, Edit, Trash2 } from 'lucide-react';
import AssetCard from './AssetCard';

export default function SpacesList({
  spaces,
  onShowTimeline,
  onCreateAsset,
  onEditSpace,
  onDeleteSpace,
  onEditAsset,
  onDeleteAsset,
  onDeleteFeature,
}: {
  spaces: any[];
  onShowTimeline: (title: string, spaceId: string) => void;
  onCreateAsset: (spaceId: string, spaceName: string) => void;
  onEditSpace: (spaceId: string, spaceName: string) => void;
  onDeleteSpace: (spaceId: string, spaceName: string) => void;
  onEditAsset: (spaceId: string, spaceName: string, assetId: string, assetType: string) => void;
  onDeleteAsset: (assetId: string, assetName: string) => void;
  onDeleteFeature: (assetId: string, featureName: string) => void;
}) {
  const visibleSpaces = (spaces || []).filter(s => !s.deleted);

  return (
    <>
      {visibleSpaces.map((space) => (
        <Card key={space.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="font-semibold">{space.name}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => onShowTimeline(space.name, space.id)}>
                <History className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onCreateAsset(space.id, space.name)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEditSpace(space.id, space.name)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDeleteSpace(space.id, space.name)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[50vh] overflow-auto">
            {(space.assets || []).filter((a: any) => !a.deleted).map((asset: any) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={() => onEditAsset(space.id, space.name, asset.id, asset.assetTypes?.name)}
                onDelete={() => onDeleteAsset(asset.id, asset.assetTypes?.name)}
                onDeleteFeature={(key: string) => onDeleteFeature(asset.id, key)}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
