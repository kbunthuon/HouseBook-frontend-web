import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ImageViewer({
  images,
  selectedImage,
  selectedImageIndex,
  onClose,
  onNext,
  onPrev,
}: {
  images: string[];
  selectedImage: string | null;
  selectedImageIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  if (!selectedImage) return null;
  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', animation: 'fadeIn 0.2s ease-in-out' }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes imageZoom {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {images && images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all z-10"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      <div
        className="relative flex items-center justify-center p-4"
        style={{ maxWidth: '90vw', maxHeight: '90vh', animation: 'imageZoom 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo(selectedImage) ? (
          <video
            src={selectedImage}
            controls
            autoPlay
            className="max-w-full max-h-full shadow-2xl rounded-2xl"
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          />
        ) : (
          <img
            src={selectedImage}
            alt="Property Image"
            className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl"
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          />
        )}
      </div>


      {images && images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all z-10"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all z-10"
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <X className="h-6 w-6" />
      </button>

      {images && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full text-sm z-10" style={{ backdropFilter: 'blur(10px)' }}>
          {selectedImageIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
