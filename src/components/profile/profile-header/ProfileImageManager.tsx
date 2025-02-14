import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ddApi } from "../../../services/dd-api";
import { Button } from "../../ui/Button";

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be less than 10MB");
      return;
    }

    // Validate file type
    if (!VALID_MIME_TYPES.includes(file.type)) {
      toast.error(
        `Unsupported file type. Please use ${VALID_EXTENSIONS.join(", ")}`
      );
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

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

  const handleCropComplete = (pixelCrop: PixelCrop) => {
    if (!previewImage) return;

    const image = new Image();
    image.src = previewImage;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match crop dimensions
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert to WebP format for better compression
    setCroppedImageUrl(canvas.toDataURL("image/webp", 0.9));
  };

  const handleUpload = async () => {
    if (!croppedImageUrl) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Convert base64 to blob
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("image", blob, `${userAddress}_${Date.now()}.webp`);

      const uploadResponse = await ddApi.fetch(
        `/dd-serv/users/${userAddress}/profile-image`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!uploadResponse.ok) {
        switch (uploadResponse.status) {
          case 400:
            throw new Error("Invalid image format or size");
          case 401:
            throw new Error("Unauthorized. Please reconnect your wallet");
          case 413:
            throw new Error("Image size too large. Maximum size is 10MB");
          case 415:
            throw new Error("Unsupported image format");
          default:
            throw new Error("Failed to upload image");
        }
      }

      const responseData: ImageUploadResponse = await uploadResponse.json();

      if (!responseData.success) {
        throw new Error(responseData.message || "Failed to upload image");
      }

      toast.success(
        responseData.message || "Profile image updated successfully"
      );
      onImageUpdate(responseData.data.profile_image_url);
      setPreviewImage(null);
      setCroppedImageUrl(null);
      setUploadProgress(100);
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload profile image"
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    try {
      setIsUploading(true);
      const response = await ddApi.fetch(
        `/dd-serv/users/${userAddress}/profile-image`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
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
        responseData.message || "Profile image removed successfully"
      );
      onImageUpdate(""); // Clear the image URL
    } catch (error) {
      console.error("Failed to remove profile image:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove profile image"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {currentImageUrl && !previewImage && (
        <div className="relative group">
          <img
            src={currentImageUrl}
            alt="Current profile"
            className="w-32 h-32 rounded-full object-cover mx-auto"
            crossOrigin="anonymous"
          />
          <button
            onClick={handleRemove}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
          >
            <span className="text-red-300">Remove Image</span>
          </button>
        </div>
      )}

      {/* Image Upload Area */}
      {!previewImage && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? "border-brand-400 bg-brand-400/10"
              : "border-dark-400 hover:border-brand-400/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <div className="text-gray-400">
              {isDragActive ? (
                <p>Drop the image here ...</p>
              ) : (
                <p>Drag & drop an image here, or click to select</p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Supports: PNG, JPG, GIF, WebP (max 10MB)
            </p>
          </div>
        </div>
      )}

      {/* Image Preview & Crop */}
      {previewImage && (
        <div className="space-y-4">
          <ReactCrop
            crop={crop}
            onChange={(c: Crop) => setCrop(c)}
            onComplete={handleCropComplete}
            aspect={1}
            circularCrop
          >
            <img src={previewImage} alt="Preview" crossOrigin="anonymous" />
          </ReactCrop>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setPreviewImage(null);
                setCroppedImageUrl(null);
                setUploadProgress(0);
              }}
              variant="outline"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!croppedImageUrl || isUploading}
              className="relative min-w-[100px]"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {uploadProgress > 0 ? `${uploadProgress}%` : "Uploading..."}
                  </span>
                </div>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
