import supabase from "../config/supabaseClient";

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