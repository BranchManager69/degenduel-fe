import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";

interface ProfileImageManagerProps {
  userAddress: string;
  currentImageUrl?: string;
  onImageUpdate: (newUrl: string) => void;
}

interface ImageUploadResponse {
  success: boolean;
  message: string;
  data: {
    profile_image_url: string;
    updated_at: string;
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

export const ProfileImageManager: React.FC<ProfileImageManagerProps> = ({
  userAddress,
  currentImageUrl,
  onImageUpdate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);


  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    console.log("Files dropped:", { acceptedFiles, rejectedFiles });
    
    const file = acceptedFiles[0];
    if (!file) {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        console.error("File rejected:", rejection);
        toast.error(`File rejected: ${rejection.errors?.[0]?.message || 'Unknown error'}`);
      }
      return;
    }

    console.log("Processing file:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file size (10MB limit)
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be less than 10MB");
      return;
    }

    // Validate file type
    if (!VALID_MIME_TYPES.includes(file.type)) {
      toast.error(
        `Unsupported file type. Please use ${VALID_EXTENSIONS.join(", ")}`,
      );
      return;
    }

    // Store the file for upload
    setSelectedFile(file);
    // Immediately upload
    handleUpload(file);
  }, [userAddress, onImageUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  const handleUpload = async (file?: File) => {
    const uploadFile = file || selectedFile;
    if (!uploadFile) {
      console.error("No file selected");
      return;
    }

    try {
      console.log("Starting image upload for user:", userAddress);
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      const filename = `${userAddress}_${Date.now()}.${uploadFile.name.split('.').pop()}`;
      formData.append("image", uploadFile, filename);
      console.log("Created FormData with filename:", filename);

      // Use native fetch for file uploads to avoid Content-Type header issues
      console.log("Sending upload request to:", `/api/users/${userAddress}/profile-image`);
      const uploadResponse = await fetch(
        `/api/users/${userAddress}/profile-image`,
        {
          method: "POST",
          body: formData,
          credentials: "include", // Important for auth
          headers: {
            Accept: "application/json",
            // Don't set Content-Type - let browser set multipart/form-data automatically
          },
        },
      );

      console.log("Upload response:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        headers: Object.fromEntries(uploadResponse.headers.entries())
      });

      if (!uploadResponse.ok) {
        let errorText = "";
        let errorData: any = null;
        
        try {
          errorText = await uploadResponse.text();
          errorData = JSON.parse(errorText);
        } catch {
          // If not JSON, use raw text
        }
        
        console.error("Upload failed:", {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          body: errorText,
          data: errorData
        });
        
        switch (uploadResponse.status) {
          case 400:
            throw new Error(errorData?.message || "Invalid image format or size");
          case 401:
            throw new Error("Unauthorized. Please reconnect your wallet");
          case 413:
            throw new Error("Image size too large. Maximum size is 10MB");
          case 415:
            throw new Error("Unsupported image format. Use JPEG, PNG, GIF or WebP");
          case 429:
            throw new Error("Too many requests. Please try again later");
          case 500:
            throw new Error("Server error. Please try again later");
          case 503:
            throw new Error("Service unavailable. Please try again later");
          default:
            throw new Error(errorData?.message || `Failed to upload image (${uploadResponse.status})`);
        }
      }

      const responseData: ImageUploadResponse = await uploadResponse.json();
      console.log("Upload successful:", responseData);

      if (!responseData.success) {
        throw new Error(responseData.message || "Failed to upload image");
      }

      toast.success(
        responseData.message || "Profile image updated successfully",
      );
      onImageUpdate(responseData.data.profile_image_url);
      setSelectedFile(null);
      setUploadProgress(100);
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload profile image",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    try {
      setIsUploading(true);
      // Use native fetch for consistency with upload
      const response = await fetch(
        `/api/users/${userAddress}/profile-image`,
        {
          method: "DELETE",
          credentials: "include", // Important for auth
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        switch (response.status) {
          case 401:
            throw new Error("Unauthorized. Please reconnect your wallet");
          case 404:
            throw new Error("No profile image found");
          default:
            throw new Error("Failed to remove image");
        }
      }

      const responseData = await response.json();
      toast.success(
        responseData.message || "Profile image removed successfully",
      );
      onImageUpdate(""); // Clear the image URL
    } catch (error) {
      console.error("Failed to remove profile image:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove profile image",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {currentImageUrl && !selectedFile && (
        <div className="relative group">
          <img
            src={`${currentImageUrl}?t=${Date.now()}`}
            alt="Current profile"
            className="w-32 h-32 rounded-full object-cover mx-auto border-2 border-brand-400/30"
            crossOrigin="anonymous"
          />
          <button
            onClick={handleRemove}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
            aria-label="Remove profile image"
          >
            <div className="h-10 w-10 bg-red-500/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-400/50 hover:bg-red-500/80 transition-all duration-200 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Image Upload Area */}
      {!isUploading && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 mx-auto flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
              isDragActive
                ? "border-brand-400 bg-brand-400/10 scale-105"
                : "border-dark-400/50 hover:border-brand-400/50 hover:bg-brand-400/5"
            }`}
            aria-label="Upload profile image"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${isDragActive ? 'text-brand-400' : 'text-gray-500'} transition-colors mb-3`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              <div className="text-sm font-medium text-gray-300 mb-1">
                {isDragActive ? "Drop image here" : "Click to upload or drag & drop"}
              </div>
              <div className="text-xs text-gray-500">
                PNG, JPG, GIF, WebP (max 10MB)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 relative">
            <div className="w-full h-full border-4 border-brand-400/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-brand-400 rounded-full animate-spin border-t-transparent" />
            {uploadProgress > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-brand-400">{uploadProgress}%</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400">Uploading your image...</p>
        </div>
      )}
    </div>
  );
};
