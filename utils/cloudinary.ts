export const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dp0dbixv1'; 
export const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ieeecompeconnect';

export const getOptimizedImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  
  // Inject transformation parameters: fill crop, auto gravity, 800x450 (16:9)
  // This ensures the image is perfectly centered and scaled down to save bandwidth
  return url.replace('/upload/', '/upload/c_fill,g_auto,w_800,h_450/');
};

export const uploadFileToCloudinary = async (fileUri: string, isDocument: boolean = false): Promise<string> => {
  const formData = new FormData();
  
  const filename = fileUri.split('/').pop() || 'upload.file';
  let type = 'application/octet-stream';
  
  if (!isDocument) {
    const match = /\.(\w+)$/.exec(filename);
    type = match ? `image/${match[1]}` : `image/jpeg`;
  } else {
    // Basic mapping for common document types
    if (filename.endsWith('.pdf')) type = 'application/pdf';
    else if (filename.endsWith('.doc') || filename.endsWith('.docx')) type = 'application/msword';
    else if (filename.endsWith('.ppt') || filename.endsWith('.pptx')) type = 'application/vnd.ms-powerpoint';
  }

  formData.append('file', {
    uri: fileUri,
    type,
    name: filename
  } as any);

  formData.append('upload_preset', UPLOAD_PRESET);

  // Use 'auto' to support both images and raw files like PDFs
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'Failed to upload file');
    }
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    throw err;
  }
};
