import { useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useS3Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get presigned URL from backend
      const { data } = await api.post('/upload/presigned-url', {
        fileName: file.name,
        fileType: file.type,
      });

      const { uploadUrl, fileUrl } = data;

      // 2. Upload file directly to S3
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      toast.success('Image uploaded successfully');
      return { fileUrl, key: data.key };
    } catch (error: any) {
      console.error('S3 Upload error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload image to S3');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
  };
};
