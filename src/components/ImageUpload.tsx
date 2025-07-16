import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  existingImages?: string[];
}

export const ImageUpload = ({ onImagesChange, maxImages = 5, existingImages = [] }: ImageUploadProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('ad-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > maxImages) {
      toast({
        title: t('Khalad', 'Error'),
        description: t(`Waxaad soo gelin kartaa ugu badan ${maxImages} sawir`, `You can upload maximum ${maxImages} images`),
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('Khalad', 'Error'),
          description: t('Fadlan dooro sawirro keliya', 'Please select images only'),
          variant: 'destructive'
        });
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('Khalad', 'Error'),
          description: t('Sawirka waa inuu ka yar yahay 5MB', 'Image must be less than 5MB'),
          variant: 'destructive'
        });
        continue;
      }

      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        newImages.push(imageUrl);
      }
    }

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);
    setUploading(false);

    if (newImages.length > 0) {
      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t(`${newImages.length} sawir ayaa la soo geliyay`, `${newImages.length} images uploaded`)
      });
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {t('Sawirrada', 'Images')} ({images.length}/{maxImages})
      </Label>
      
      {/* Upload Button */}
      {images.length < maxImages && (
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
            disabled={uploading}
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              asChild
            >
              <div className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {uploading 
                  ? t('Soo gelaya...', 'Uploading...') 
                  : t('Dooro Sawirro', 'Select Images')
                }
              </div>
            </Button>
          </label>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((imageUrl, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={imageUrl}
                    alt={`${t('Sawir', 'Image')} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Instructions */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          {t('Faahfaahin:', 'Instructions:')}
        </p>
        <ul className="text-xs space-y-1 ml-6">
          <li>• {t(`Ugu badan ${maxImages} sawir`, `Maximum ${maxImages} images`)}</li>
          <li>• {t('Cabbirka ugu badan: 5MB', 'Maximum size: 5MB')}</li>
          <li>• {t('Noocyada la aqbalo: JPG, PNG, WEBP', 'Accepted formats: JPG, PNG, WEBP')}</li>
          <li>• {t('Sawirka ugu horeya wuxuu noqon doonaa sawirka weyn', 'First image will be the main image')}</li>
        </ul>
      </div>
    </div>
  );
};