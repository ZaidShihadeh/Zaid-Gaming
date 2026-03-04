import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DevicePhotoUploaderProps {
  onPhotoSelect: (photoDataUrl: string) => void;
  currentPhoto?: string;
}

export default function DevicePhotoUploader({
  onPhotoSelect,
  currentPhoto,
}: DevicePhotoUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (
    file: File,
    maxWidth: number = 800,
    quality: number = 0.8,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit for original file)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      // Compress the image to reduce size
      const compressedDataUrl = await compressImage(file, 800, 0.8);

      // Check compressed size (should be under 1MB base64)
      if (compressedDataUrl.length > 1.5 * 1024 * 1024) {
        // Try higher compression
        const furtherCompressed = await compressImage(file, 600, 0.6);
        setPreviewUrl(furtherCompressed);
      } else {
        setPreviewUrl(compressedDataUrl);
      }
    } catch (error) {
      console.error("Image compression error:", error);
      toast({
        title: "Image processing failed",
        description:
          "Failed to process the image. Please try a different image.",
        variant: "destructive",
      });
    }
  };

  const handleFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleUsePhoto = () => {
    if (previewUrl) {
      onPhotoSelect(previewUrl);
      setIsOpen(false);
      setPreviewUrl(null);
      toast({
        title: "Photo updated!",
        description: "Your profile picture has been updated successfully.",
      });
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setIsOpen(false);
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="bg-gaming-dark/50 border-gaming-border hover:bg-gaming-dark/70"
          >
            <Camera className="mr-2 h-4 w-4" />
            Change Photo
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gaming-card border-gaming-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neon-blue">
              Update Profile Picture
            </DialogTitle>
            <DialogDescription>
              Choose how you want to add your photo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!previewUrl ? (
              // Photo selection options
              <div className="space-y-4">
                <Button
                  onClick={handleFromDevice}
                  className="w-full bg-gaming-dark/50 hover:bg-gaming-dark/70 border border-gaming-border justify-start"
                  variant="outline"
                >
                  <ImageIcon className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">From Photos</div>
                    <div className="text-xs text-muted-foreground">
                      Choose from your device
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={handleTakePhoto}
                  className="w-full bg-gaming-dark/50 hover:bg-gaming-dark/70 border border-gaming-border justify-start"
                  variant="outline"
                >
                  <Camera className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Take Photo</div>
                    <div className="text-xs text-muted-foreground">
                      Use your device camera
                    </div>
                  </div>
                </Button>

                {currentPhoto && (
                  <div className="space-y-2 pt-4 border-t border-gaming-border">
                    <Label className="text-sm text-muted-foreground">
                      Current Photo
                    </Label>
                    <img
                      src={currentPhoto}
                      alt="Current profile picture"
                      className="w-16 h-16 rounded-lg object-cover border border-gaming-border mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              // Photo preview and confirmation
              <div className="space-y-4">
                <div className="text-center">
                  <Label className="text-sm text-muted-foreground">
                    Preview
                  </Label>
                  <img
                    src={previewUrl}
                    alt="Photo preview"
                    className="w-32 h-32 rounded-lg object-cover border border-gaming-border mx-auto mt-2"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 border-gaming-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUsePhoto}
                    className="flex-1 bg-neon-blue hover:bg-neon-blue/80"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Use Photo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
