import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';
import { Plus, Trash2, Image, Film } from 'lucide-react';

export default function ImageGallery({
  images,
  onOpenViewer,
  onOpenUpload,
  onOpenDelete,
  onOpenSplash,
}: {
  images: string[];
  onOpenViewer: (url: string, idx: number) => void;
  onOpenUpload: () => void;
  onOpenDelete: () => void;
  onOpenSplash: () => void;
}) {
  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-4">
        <CardTitle className="flex items-center">
          <Image className="h-5 w-5 mr-2" />
          Property Media
        </CardTitle>
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onOpenUpload}>
            <Plus className="h-4 w-4 mr-2" />
            Add Image/Video
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenDelete} disabled={!images || images.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Image
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSplash} disabled={!images || images.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Select Splash Image
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {images && images.length > 0 ? (
          <div className="overflow-x-auto py-4">
            <div className="flex gap-6 w-max">
              {images.map((url: string, idx: number) => (
                <div
                  key={idx}
                  className="shrink-0 bg-gray-50 rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col cursor-pointer"
                  style={{ width: '320px', height: '320px' }}
                  onClick={() => onOpenViewer(url, idx)}
                >
                  <div className="w-full bg-muted flex items-center justify-center overflow-hidden" style={{ height: '320px' }}>
                    {isVideo(url) ? (
                      <video src={url} className="w-full h-full" style={{ objectFit: 'contain' }} controls />
                    ) : (
                      <img src={url} alt={`Property Image ${idx + 1}`} className="w-full h-full" style={{ objectFit: 'contain' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">No images available</div>
        )}
      </CardContent>
    </Card>
  );
}