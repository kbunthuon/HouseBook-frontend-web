import { useEffect } from 'react';

export function useImageNavigation(
  images: string[] | undefined,
  selectedImage: string | null,
  selectedImageIndex: number,
  setSelectedImage: (s: string | null) => void,
  setSelectedImageIndex: (i: number) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage || !images || images.length === 0) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1;
        setSelectedImageIndex(prevIndex);
        setSelectedImage(images[prevIndex]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (selectedImageIndex + 1) % images.length;
        setSelectedImageIndex(nextIndex);
        setSelectedImage(images[nextIndex]);
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
        setSelectedImageIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, selectedImage, selectedImageIndex, setSelectedImage, setSelectedImageIndex]);
}

export default useImageNavigation;
