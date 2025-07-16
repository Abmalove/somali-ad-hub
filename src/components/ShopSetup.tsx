import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { regions } from '@/data/categories';
import { supabase } from '@/integrations/supabase/client';
import { Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShopSetupProps {
  user: any;
  onComplete: () => void;
}

export const ShopSetup = ({ user, onComplete }: ShopSetupProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    has_shop: false,
    shop_name: '',
    shop_region: '',
    phone: ''
  });

  const getCountryCode = (region: string) => {
    if (region.toLowerCase().includes('kenya')) return '+254';
    if (region.toLowerCase().includes('somalia')) return '+252';
    if (region.toLowerCase().includes('djibouti')) return '+253';
    return '+252'; // Default to Somalia
  };

  const handleRegionChange = (region: string) => {
    const countryCode = getCountryCode(region);
    setFormData(prev => ({
      ...prev,
      shop_region: region,
      phone: countryCode
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number if shop is selected
      if (formData.has_shop) {
        if (!formData.shop_name || !formData.shop_region || !formData.phone) {
          toast({
            title: t('Khalad', 'Error'),
            description: t('Fadlan buuxi dhammaan goobaha muhiimka ah', 'Please fill all required fields'),
            variant: 'destructive'
          });
          return;
        }
      }

      const profileData = {
        user_id: user.id,
        email: user.email,
        has_shop: formData.has_shop,
        shop_name: formData.has_shop ? formData.shop_name : null,
        shop_region: formData.has_shop ? formData.shop_region : null,
        phone: formData.phone || null,
        shop_setup_completed: true
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Profile-kaagu waa diyaarsan yahay', 'Your profile is ready')
      });

      onComplete();
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'An error occurred'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {t('Ku soo dhowow!', 'Welcome!')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('Fadlan buuxi macluumaadka aasaasiga ah', 'Please complete your basic information')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shop Question */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {t('Ma leedahay dukaan ama ganacsi?', 'Do you have a shop or business?')}
              </Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.has_shop ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, has_shop: true })}
                  className="flex-1"
                >
                  {t('Haa', 'Yes')}
                </Button>
                <Button
                  type="button"
                  variant={!formData.has_shop ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, has_shop: false, shop_name: '', shop_region: '' })}
                  className="flex-1"
                >
                  {t('Maya', 'No')}
                </Button>
              </div>
            </div>

            {/* Shop Details */}
            {formData.has_shop && (
              <>
                <div>
                  <Label htmlFor="shop_name">{t('Magaca Dukaanka', 'Shop Name')} *</Label>
                  <Input
                    id="shop_name"
                    value={formData.shop_name}
                    onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                    placeholder={t('Magaca dukaankaaga', 'Your shop name')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="shop_region">{t('Gobolka Dukaanka', 'Shop Region')} *</Label>
                  <Select 
                    value={formData.shop_region} 
                    onValueChange={handleRegionChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Dooro gobolka', 'Select region')} />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Phone Number */}
            <div>
              <Label htmlFor="phone">{t('Lambarka Telefoonka', 'Phone Number')} *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+252..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('Lambarka waa inuu ku bilaabmaa +252 (Somalia), +254 (Kenya), ama +253 (Djibouti)', 
                   'Phone number should start with +252 (Somalia), +254 (Kenya), or +253 (Djibouti)')}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('Sugaya...', 'Loading...') : t('Sii wad', 'Continue')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};