import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { regions } from '@/data/categories';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const EditProfile = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    has_shop: false,
    shop_name: '',
    shop_region: '',
    phone: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          has_shop: data.has_shop || false,
          shop_name: data.shop_name || '',
          shop_region: data.shop_region || '',
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

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
      phone: prev.phone.startsWith('+') ? countryCode : countryCode + prev.phone.replace(/^\+?\d{3}/, '')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        has_shop: formData.has_shop,
        shop_name: formData.has_shop ? formData.shop_name : null,
        shop_region: formData.has_shop ? formData.shop_region : null,
        phone: formData.phone,
        shop_setup_completed: formData.has_shop
      };

      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user?.id,
            email: user?.email,
            ...updateData
          });

        if (error) throw error;
      }

      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Profile-kaaga waa la cusboonaysiiyey', 'Your profile has been updated')
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'An error occurred'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <LanguageToggle />
      
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate('/profile')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('Dib u noqo', 'Go Back')}
        </Button>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {t('Wax ka beddel Profile-ka', 'Edit Profile')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shop Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_shop"
                    checked={formData.has_shop}
                    onChange={(e) => setFormData({ ...formData, has_shop: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="has_shop">
                    {t('Waan leeyahay dukaan', 'I have a shop')}
                  </Label>
                </div>

                {formData.has_shop && (
                  <>
                    <div>
                      <Label htmlFor="shop_name">{t('Magaca Dukaanka', 'Shop Name')} *</Label>
                      <Input
                        id="shop_name"
                        value={formData.shop_name}
                        onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                        placeholder={t('Magaca dukaankaaga', 'Your shop name')}
                        required={formData.has_shop}
                      />
                    </div>

                    <div>
                      <Label htmlFor="shop_region">{t('Gobolka Dukaanka', 'Shop Region')} *</Label>
                      <Select 
                        value={formData.shop_region} 
                        onValueChange={handleRegionChange}
                        required={formData.has_shop}
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

                <div>
                  <Label htmlFor="phone">{t('Lambarka Telefoonka', 'Phone Number')} *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+252..."
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('Lambarka waa inuu ku bilaabmaa +252 (Somalia), +254 (Kenya), ama +253 (Djibouti)', 
                       'Phone number should start with +252 (Somalia), +254 (Kenya), or +253 (Djibouti)')}
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('Sugaya...', 'Loading...') : t('Kaydi', 'Save')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default EditProfile;