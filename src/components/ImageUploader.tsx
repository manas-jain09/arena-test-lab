
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploaderProps {
  imageUrl: string | undefined;
  onImageChange: (url: string | undefined) => void;
  questionId: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  imageUrl, 
  onImageChange,
  questionId
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${questionId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `quiz-images/${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('quiz-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('quiz-content')
        .getPublicUrl(filePath);

      onImageChange(publicUrlData.publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    onImageChange(undefined);
  };

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Question" 
            className="max-h-40 rounded-md object-contain border border-gray-200" 
          />
          <Button 
            size="icon" 
            variant="destructive" 
            className="absolute top-1 right-1 h-6 w-6"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            className="text-sm relative overflow-hidden"
            disabled={isUploading}
          >
            {isUploading ? (
              "Uploading..."
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" /> Add Image
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
