import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Camera, Upload, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface ProfileAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUploadButton?: boolean;
  editable?: boolean;
  className?: string;
  onImageUpdate?: (imageUrl: string) => void;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

const uploadButtonSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
};

export function ProfileAvatar({ 
  user, 
  size = 'md', 
  showUploadButton = false,
  editable = false,
  className,
  onImageUpdate 
}: ProfileAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(user.profileImageUrl || '');
  const { toast } = useToast();

  const getInitials = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      formData.append('userId', user.id);

      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImageUrl(result.imageUrl);
        onImageUpdate?.(result.imageUrl);
        setIsDialogOpen(false);
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been successfully updated"
        });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpdate = async () => {
    if (!imageUrl.trim()) return;

    try {
      const response = await fetch('/api/update-profile-image-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          imageUrl: imageUrl.trim()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onImageUpdate?.(imageUrl);
        setIsDialogOpen(false);
        toast({
          title: "Profile picture updated",
          description: "Your profile picture URL has been updated"
        });
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile picture",
        variant: "destructive"
      });
    }
  };

  const handleRemoveImage = async () => {
    try {
      const response = await fetch('/api/remove-profile-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (response.ok) {
        setImageUrl('');
        onImageUpdate?.('');
        setIsDialogOpen(false);
        toast({
          title: "Profile picture removed",
          description: "Your profile picture has been removed"
        });
      } else {
        throw new Error(result.message || 'Remove failed');
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Failed to remove profile picture",
        variant: "destructive"
      });
    }
  };

  const AvatarComponent = (
    <div className={cn("relative inline-block", className)}>
      <Avatar className={cn(sizeClasses[size], "ring-2 ring-background")}>
        <AvatarImage 
          src={imageUrl || user.profileImageUrl || ""} 
          alt={getDisplayName(user)}
          className="object-cover"
        />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
          {getInitials(user)}
        </AvatarFallback>
      </Avatar>
      
      {showUploadButton && (
        <Button
          size="sm"
          className={cn(
            "absolute -bottom-1 -right-1 rounded-full p-1",
            uploadButtonSizes[size]
          )}
          onClick={() => setIsDialogOpen(true)}
        >
          <Camera className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  if (!editable && !showUploadButton) {
    return AvatarComponent;
  }

  return (
    <>
      {editable ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
              {AvatarComponent}
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Profile Picture</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Current Avatar Preview */}
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={imageUrl || user.profileImageUrl || ""} 
                    alt={getDisplayName(user)}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Upload File Section */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Image</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>

              {/* URL Input Section */}
              <div className="space-y-2">
                <Label htmlFor="image-url">Or paste image URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="image-url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleUrlUpdate}
                    size="sm"
                    disabled={!imageUrl.trim()}
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* Remove Image Button */}
              {(imageUrl || user.profileImageUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveImage}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Profile Picture
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        AvatarComponent
      )}
    </>
  );
}

// Simple read-only avatar component for display purposes
export function UserAvatar({ 
  user, 
  size = 'md',
  className 
}: {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return <ProfileAvatar user={user} size={size} className={className} />;
}