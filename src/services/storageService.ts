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
        
        const options = {
          maxSizeMB: 1, // Compress to ~1MB max
          maxWidthOrHeight: 1920, // Max dimension 1920px
          useWebWorker: true, // Use web workers for performance
          fileType: fileToUpload.type === 'image/png' ? 'image/png' : 'image/jpeg', // maintain png transparency, convert webp/others to jpeg for standard compression
        };

        try {
          // Compress the file
          const compressedBlob = await imageCompression(fileToUpload, options);
          
          // Re-wrap in a File object to retain the original filename
          fileToUpload = new File([compressedBlob], fileToUpload.name, {
            type: options.fileType,
            lastModified: Date.now(),
          });
          
          console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)} MB, Compressed: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (compressionError) {
          console.warn('Image compression failed, falling back to original file:', compressionError);
          // If compression fails for some reason, we just proceed with the uncompressed file (or HEIC converted file)
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
