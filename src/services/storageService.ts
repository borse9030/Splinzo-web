export const storageService = {
  /**
   * Uploads a file to Cloudflare R2 using a presigned URL.
   * @param file The File object to upload
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: File): Promise<string> {
    try {
      // 1. Get the presigned URL from our API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const { presignedUrl, publicUrl } = await response.json();

      // 2. Upload the file directly to Cloudflare R2
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // 3. Return the public URL to be saved in Firestore
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },
};
