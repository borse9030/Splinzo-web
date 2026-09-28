export const storageService = {
  /**
   * Uploads a file to Cloudflare R2 using a presigned URL.
   * @param file The File object to upload
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: File): Promise<string> {
    try {
      let fileToUpload = file;

      // 1. Convert HEIC/HEIF to JPEG
      const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                     file.name.toLowerCase().endsWith('.heif') ||
                     file.type === 'image/heic' || 
                     file.type === 'image/heif';

      if (isHeic) {
        // Dynamically import heic2any to avoid SSR issues
        const heic2any = (await import('heic2any')).default;
        
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8,
        });

        // heic2any can return an array of blobs if it's a sequence, we take the first
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        
        // Construct a new filename replacing .heic/.heif with .jpg
        const newFilename = file.name.replace(/\.hei[cf]$/i, '.jpg');
        
        // Create a new File object from the Blob
        fileToUpload = new File([blob], newFilename, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
      }

      // 2. Compress the image (works for all images, including the one we just converted)
      if (fileToUpload.type.startsWith('image/')) {
        const imageCompression = (await import('browser-image-compression')).default;
        
        const isPng = fileToUpload.type === 'image/png';
        const targetFileType = isPng ? 'image/png' : 'image/webp';
        const targetExtension = isPng ? '.png' : '.webp';

        const options = {
          maxSizeMB: 0.25, // Compress to ~250KB max (drastically cuts R2 egress & storage cost)
          maxWidthOrHeight: 1280, // 1280px is optimal for receipts, bills, and profile pictures
          useWebWorker: true, // Use web workers for background compression without freezing UI
          fileType: targetFileType,
          initialQuality: 0.75,
        };

        try {
          // Compress the file
          const compressedBlob = await imageCompression(fileToUpload, options);
          
          // Re-wrap in a File object with updated extension if WebP converted
          const baseName = fileToUpload.name.replace(/\.[^/.]+$/, "");
          const newName = `${baseName}${targetExtension}`;
          
          fileToUpload = new File([compressedBlob], newName, {
            type: targetFileType,
            lastModified: Date.now(),
          });
          
          console.log(`[Storage] Image optimized: ${(file.size / 1024).toFixed(1)} KB -> ${(fileToUpload.size / 1024).toFixed(1)} KB (${targetFileType})`);
        } catch (compressionError) {
          console.warn('[Storage] Image compression fallback to original:', compressionError);
          // Fallback gracefully to original file
        }
      }

      // 3. Get the presigned URL from our API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileToUpload.name,
          contentType: fileToUpload.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const { presignedUrl, publicUrl } = await response.json();

      // 3. Upload the file directly to Cloudflare R2
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: fileToUpload,
        headers: {
          'Content-Type': fileToUpload.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // 4. Return the public URL to be saved in Firestore
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },
};
