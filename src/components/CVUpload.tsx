import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CVUploadProps {
  onCVChange: (url: string | null) => void;
  existingCV?: string | null;
}

export const CVUpload = ({ onCVChange, existingCV = null }: CVUploadProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [cvUrl, setCvUrl] = useState<string | null>(existingCV);
  const [uploading, setUploading] = useState(false);

  const uploadCV = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cv_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cv-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('cv-files')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading CV:', error);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('Khalad', 'Error'),
        description: t('Fadlan dooro PDF ama Word faylka', 'Please select PDF or Word file'),
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('Khalad', 'Error'),
        description: t('Faylka waa inuu ka yar yahay 10MB', 'File must be less than 10MB'),
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    const uploadedUrl = await uploadCV(file);
    
    if (uploadedUrl) {
      setCvUrl(uploadedUrl);
      onCVChange(uploadedUrl);
      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('CV-ga waa la soo geliyay', 'CV uploaded successfully')
      });
    } else {
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay CV-ga soo gelinta', 'Error uploading CV'),
        variant: 'destructive'
      });
    }
    
    setUploading(false);
  };

  const removeCV = () => {
    setCvUrl(null);
    onCVChange(null);
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'CV';
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {t('CV/Resume', 'CV/Resume')}
      </Label>
      
      {/* Upload Button */}
      {!cvUrl && (
        <div>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="cv-upload"
            disabled={uploading}
          />
          <label htmlFor="cv-upload">
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
                  : t('Dooro CV', 'Select CV')
                }
              </div>
            </Button>
          </label>
        </div>
      )}

      {/* CV Preview */}
      {cvUrl && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{getFileName(cvUrl)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('CV waa la soo geliyay', 'CV uploaded')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(cvUrl, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeCV}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Instructions */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t('Faahfaahin:', 'Instructions:')}
        </p>
        <ul className="text-xs space-y-1 ml-6">
          <li>• {t('Noocyada la aqbalo: PDF, DOC, DOCX', 'Accepted formats: PDF, DOC, DOCX')}</li>
          <li>• {t('Cabbirka ugu badan: 10MB', 'Maximum size: 10MB')}</li>
          <li>• {t('Hubo in CV-gaagu uu leeyahay macluumaadka muhiimka ah', 'Make sure your CV contains important information')}</li>
        </ul>
      </div>
    </div>
  );
};