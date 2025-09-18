import {supabase} from "./config/supabaseClient";

export const uploadPropertyImage = async (fileBuffer: Buffer, filePath: string, mimetype?: string) => {
  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from("PropertyImage")
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: mimetype || "application/octet-stream",
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("PropertyImage")
      .getPublicUrl(filePath);

    return { ...data, publicUrl: publicUrl.publicUrl };
  } catch (err) {
    console.error("Error uploading image:", err);
    throw err;
  }
};
