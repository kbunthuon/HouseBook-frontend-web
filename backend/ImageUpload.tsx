import React, { useState } from "react";
import {supabase} from "../config/supabaseClient";

// Upload function (existing)
export const uploadImageToPropertyImageBucket = async (
    file: File,
    filePath: string
): Promise<{ data: any; error: any }> => {
    const { data, error } = await supabase.storage
        .from('PropertyImage')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || "application/octet-stream",
        });

    if (error) {
        console.error("Error uploading image:", error);
        return { data: null, error };
    }

    const { data: publicUrl } = supabase.storage
        .from("PropertyImage")
        .getPublicUrl(filePath);

    return { data: { ...data, publicUrl: publicUrl.publicUrl }, error: null };
};

// Fetch all images for a property
export const getPropertyImages = async (propertyId: string) => {
    const { data, error } = await supabase.storage
        .from("PropertyImage")
        .list(propertyId + "/", { limit: 100, offset: 0 });
    if (error) {
        console.error("Error fetching images:", error);
        return [];
    }
    // Get public URLs for each image
    return data
        .filter((item: any) => item.name && !item.name.endsWith("/"))
        .map((item: any) => {
            const { data: urlObj } = supabase.storage
                .from("PropertyImage")
                .getPublicUrl(propertyId + "/" + item.name);
            return { name: item.name, url: urlObj.publicUrl };
        });
};

// ImageUpload React component
export function ImageUpload({
    propertyId,
    onUploadComplete,
    existingImages = [],
}: {
    propertyId: string;
    onUploadComplete: (images: { name: string; url: string }[]) => void;
    existingImages?: { name: string; url: string }[];
}) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [images, setImages] = useState<{ name: string; url: string }[]>(existingImages);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleRemoveImage = (name: string) => {
        setImages((prev) => prev.filter((img) => img.name !== name));
        onUploadComplete(images.filter((img) => img.name !== name));
    };

    const handleUpload = async () => {
        setUploading(true);
        let uploaded: { name: string; url: string }[] = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
            const filePath = `${propertyId}/${Date.now()}_${file.name}`;
            const { data, error } = await uploadImageToPropertyImageBucket(file, filePath);
            if (!error && data?.publicUrl) {
                uploaded.push({ name: file.name, url: data.publicUrl });
            }
        }
        setImages((prev) => [...prev, ...uploaded]);
        setSelectedFiles([]);
        setUploading(false);
        setUploadProgress(0);
        onUploadComplete([...images, ...uploaded]);
    };

    return (
        <div>
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
            />
            {selectedFiles.length > 0 && (
                <div>
                    <ul>
                        {selectedFiles.map((file, idx) => (
                            <li key={idx}>{file.name}</li>
                        ))}
                    </ul>
                    <button onClick={handleUpload} disabled={uploading}>
                        {uploading ? `Uploading (${uploadProgress}%)...` : "Upload"}
                    </button>
                </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img) => (
                    <div key={img.url} className="relative">
                        <img src={img.url} alt={img.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #ccc" }} />
                        <button
                            style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                background: "rgba(255,255,255,0.7)",
                                border: "none",
                                borderRadius: "50%",
                                cursor: "pointer",
                                padding: 2,
                            }}
                            onClick={() => handleRemoveImage(img.name)}
                            title="Remove"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}