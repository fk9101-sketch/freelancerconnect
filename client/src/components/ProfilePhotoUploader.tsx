import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (photoUrl: string) => void;
  onPhotoRemoved?: () => void;
  buttonClassName?: string;
  children?: ReactNode;
  disabled?: boolean;
}

export function ProfilePhotoUploader({
  currentPhotoUrl,
  onPhotoUploaded,
  onPhotoRemoved,
  buttonClassName,
  children,
  disabled = false
}: ProfilePhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or WebP image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get auth token
      const token = await currentUser.getIdToken();

      // Create form data
      const formData = new FormData();
      formData.append('photo', file);

      // Upload to server
      const response = await fetch('/api/freelancer/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Firebase-User-ID': currentUser.uid
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      // Success
      onPhotoUploaded(result.photoUrl);
      setPreviewUrl(null);
      
      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated successfully.",
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    if (onPhotoRemoved) {
      onPhotoRemoved();
    }
    setPreviewUrl(null);
  };

  const handleButtonClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Photo Preview */}
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover" 
            />
          ) : currentPhotoUrl ? (
            <img 
              src={currentPhotoUrl} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <Camera className="w-8 h-8 text-muted-foreground" />
          )}
          
          {/* Remove button */}
          {(currentPhotoUrl || previewUrl) && !isUploading && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium mb-2">Profile Photo</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Upload a clear photo of yourself. JPG, PNG, or WebP format, max 2MB.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          <Button 
            onClick={handleButtonClick}
            className={buttonClassName}
            disabled={disabled || isUploading}
            data-testid="button-upload-photo"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {children || "Upload Photo"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="text-sm text-muted-foreground">
          Processing and optimizing your photo...
        </div>
      )}
    </div>
  );
}
