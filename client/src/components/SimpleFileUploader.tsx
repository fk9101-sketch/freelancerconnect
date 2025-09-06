import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { auth } from "@/lib/firebase";

interface SimpleFileUploaderProps {
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  onUploadComplete?: (fileUrl: string) => void;
  buttonClassName?: string;
  children: ReactNode;
  multiple?: boolean;
}

export function SimpleFileUploader({
  maxFileSize = 10485760, // 10MB default
  acceptedFileTypes = ['image/*'],
  onUploadComplete,
  buttonClassName,
  children,
  multiple = false
}: SimpleFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size
        if (file.size > maxFileSize) {
          toast({
            title: "File too large",
            description: `File ${file.name} is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file type
        const isValidType = acceptedFileTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.replace('/*', ''));
          }
          return file.type === type;
        });

        if (!isValidType) {
          toast({
            title: "Invalid file type",
            description: `File ${file.name} is not a supported file type.`,
            variant: "destructive",
          });
          continue;
        }

        // Get upload parameters
        const currentUser = auth.currentUser;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        if (currentUser) {
          try {
            const token = await currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
            headers['X-Firebase-User-ID'] = currentUser.uid;
          } catch (error) {
            console.warn('Failed to get auth token, proceeding without auth:', error);
          }
        }

        const paramsResponse = await fetch('/api/upload/parameters', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type
          })
        });

        if (!paramsResponse.ok) {
          throw new Error('Failed to get upload parameters');
        }

        const uploadParams = await paramsResponse.json();

        // Create form data for upload
        const formData = new FormData();
        formData.append('file', file);

        // Upload the file
        const uploadHeaders: Record<string, string> = {};
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken();
            uploadHeaders['Authorization'] = `Bearer ${token}`;
            uploadHeaders['X-Firebase-User-ID'] = currentUser.uid;
          } catch (error) {
            console.warn('Failed to get auth token for upload, proceeding without auth:', error);
          }
        }

        const uploadResponse = await fetch(uploadParams.url, {
          method: uploadParams.method,
          headers: uploadHeaders,
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadResult = await uploadResponse.json();
        
        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100);

        // Call the completion callback
        if (onUploadComplete) {
          onUploadComplete(uploadResult.uploadURL);
        }

        toast({
          title: "Upload successful",
          description: `File ${file.name} uploaded successfully.`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(',')}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      
      <Button 
        onClick={() => fileInputRef.current?.click()} 
        className={buttonClassName}
        disabled={isUploading}
        data-testid="button-upload"
      >
        {isUploading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Uploading... {Math.round(uploadProgress)}%</span>
          </div>
        ) : (
          children
        )}
      </Button>

      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
