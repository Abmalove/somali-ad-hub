import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { Settings as SettingsIcon, Crown, Star, ArrowLeft, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Settings = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

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

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const requestProUpgrade = async () => {
    setLoading(true);
    try {
      // Check if user already has a pending request
      const { data: existingRequest, error: checkError } = await supabase
        .from('admin_approvals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('approval_type', 'subscription_upgrade')
        .eq('status', 'pending')
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRequest) {
        toast({
          title: t('Codsigi wuu jiraa', 'Request Already Exists'),
          description: t('Codsigaaga waa sugaya', 'Your request is pending approval'),
          variant: 'destructive'
        });
        return;
      }

      // Create new approval request
      const { error } = await supabase
        .from('admin_approvals')
        .insert({
          user_id: user?.id,
          approval_type: 'subscription_upgrade',
          amount: 10,
          notes: 'Pro subscription upgrade request',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Codsigaaga waa la diray maamulka', 'Your upgrade request has been sent to admin')
      });

    } catch (error) {
      console.error('Error requesting upgrade:', error);
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

  const currentPlan = profile?.subscription_plan || 'free';
  const isAdmin = currentPlan === 'admin';

  return (
    <div className="min-h-screen bg-background pb-20">
      <LanguageToggle />
      
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate('/profile')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('Dib u noqo', 'Go Back')}
        </Button>

        <Card className="shadow-medium mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              {t('Dejinta', 'Settings')}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Current Plan */}
        <Card className="shadow-medium mb-6">
          <CardHeader>
            <CardTitle>{t('Qorshaha Hadda', 'Current Plan')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentPlan === 'pro' && <Crown className="h-5 w-5 text-yellow-500" />}
                {currentPlan === 'admin' && <Star className="h-5 w-5 text-purple-500" />}
                <div>
                  <p className="font-semibold capitalize">{currentPlan}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentPlan === 'free' && t('Bilaw - Bilaash', 'Basic - Free')}
                    {currentPlan === 'pro' && t('Pro - $10/bil', 'Pro - $10/month')}
                    {currentPlan === 'admin' && t('Maamule', 'Administrator')}
                  </p>
                </div>
              </div>
              <Badge 
                variant={currentPlan === 'free' ? 'secondary' : 'default'}
                className={currentPlan === 'admin' ? 'bg-purple-500' : ''}
              >
                {currentPlan}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Plan Features */}
        <div className="grid gap-4 mb-6">
          {/* Free Plan */}
          <Card className={currentPlan === 'free' ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('Qorshaha Bilaashka ah', 'Free Plan')}</span>
                {currentPlan === 'free' && <Badge>{t('Hadda', 'Current')}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ {t('Ilaa 5 xayeysiis', 'Up to 5 ads')}</li>
                <li>✓ {t('Sawirro asaasi ah', 'Basic image uploads')}</li>
                <li>✓ {t('Taageero asaasi ah', 'Basic support')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={currentPlan === 'pro' ? 'ring-2 ring-yellow-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span>{t('Qorshaha Pro', 'Pro Plan')}</span>
                </div>
                {currentPlan === 'pro' && <Badge className="bg-yellow-500">{t('Hadda', 'Current')}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm mb-4">
                <li>✓ {t('Xayeysiisyo aan xadidnayn', 'Unlimited ads')}</li>
                <li>✓ {t('Sawirro badan', 'Multiple images')}</li>
                <li>✓ {t('Xayeysiisyada kor u qaad', 'Boost ads')}</li>
                <li>✓ {t('Xayeysiisyada highlight garee', 'Highlight ads')}</li>
                <li>✓ {t('Taageero horumarsan', 'Priority support')}</li>
              </ul>
              <p className="text-lg font-semibold mb-4">$10/{t('bil', 'month')}</p>
              {currentPlan !== 'pro' && currentPlan !== 'admin' && (
                <Button 
                  onClick={requestProUpgrade}
                  disabled={loading}
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {loading ? t('Sugaya...', 'Loading...') : t('Codsii Pro', 'Request Pro')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Panel Access */}
        {isAdmin && (
          <Card className="shadow-medium mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                {t('Maamule', 'Administrator')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t('Waxaad leedahay xuquuqda maamulka', 'You have administrator privileges')}
              </p>
              <Button onClick={() => navigate('/admin')} variant="outline" className="w-full">
                <SettingsIcon className="h-4 w-4 mr-2" />
                {t('Xarunta Maaraynta', 'Admin Panel')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account Actions */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>{t('Xisaabka', 'Account')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/edit-profile')}
              className="w-full justify-start"
            >
              {t('Wax ka beddel Profile-ka', 'Edit Profile')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Settings;