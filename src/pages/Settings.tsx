import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: t('Khalad', 'Error'),
          description: t('Khalad ayaa dhacay', 'Error logging out'),
          variant: 'destructive'
        });
      } else {
        toast({
          title: t('Guuleysatay!', 'Success!'),
          description: t('Si guul leh ayaad uga baxday', 'Logged out successfully')
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'Unexpected error occurred'),
        variant: 'destructive'
      });
    }
  };

  const handleUpgradeToPro = () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentConfirm = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("payment_approvals")
        .insert([{
          user_id: user?.id,
          payment_type: 'pro_upgrade',
          amount: 10,
          payment_phone: "+254757872221",
          payment_confirmed_by_user: true,
        }]);

      if (error) {
        console.error("Error submitting payment:", error);
        toast({
          title: t('Khalad', 'Error'),
          description: t('Khalad ayaa dhacay', 'Failed to submit payment. Please try again.'),
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Codsigaaga waa la diray maaraynta', 'Pro upgrade payment submitted for approval!')
      });
      setShowPaymentConfirm(false);
      setShowPaymentDialog(false);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'An unexpected error occurred. Please try again.'),
        variant: 'destructive'
      });
    }
    setIsLoading(false);
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

        {/* Enhanced Subscription Section */}
        <Card className="shadow-elegant border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Crown className="h-6 w-6 text-primary" />
              {t('Iska-diiwaangelin', 'Subscription')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan Display */}
            <div className="relative p-6 bg-background rounded-xl border-2 border-primary/30 shadow-glow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {currentPlan === 'pro' && <Crown className="h-6 w-6 text-yellow-500" />}
                  {currentPlan === 'admin' && <Star className="h-6 w-6 text-purple-500" />}
                  {currentPlan === 'free' && <div className="h-6 w-6 rounded-full bg-muted" />}
                  <div>
                    <h3 className="text-lg font-bold capitalize">{currentPlan} Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentPlan === 'free' && t('Bilaw - Bilaash (Iska Kor Qaad)', 'Basic - Free (Limited)')}
                      {currentPlan === 'pro' && t('Pro - $10/bil - Dhammaan', 'Pro - $10/month - Unlimited')}
                      {currentPlan === 'admin' && t('Maamule - Dhammaan Xuquuqda', 'Administrator - Full Access')}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={currentPlan === 'free' ? 'outline' : 'default'}
                  className={`text-sm font-medium ${
                    currentPlan === 'admin' ? 'bg-purple-500 text-white' : 
                    currentPlan === 'pro' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {currentPlan === 'free' ? t('Bilaash', 'Free') : 
                   currentPlan === 'pro' ? t('Pro', 'Pro') : 
                   t('Maamule', 'Admin')}
                </Badge>
              </div>
              
              {/* Plan Features */}
              <div className="space-y-2 text-sm">
                {currentPlan === 'free' && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                      {t('5 xayeysiis oo bilaash ah', 'Up to 5 free ads')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                      {t('Ma laha boost/highlight', 'No boost/highlight options')}
                    </div>
                  </>
                )}
                {currentPlan === 'pro' && (
                  <>
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      {t('Xayeysiis aan xadidneyn', 'Unlimited ads')}
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      {t('Boost iyo highlight', 'Boost and highlight options')}
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      {t('Taageero degdeg ah', 'Priority support')}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Upgrade Button */}
            {profile?.subscription_plan === 'free' && (
              <div className="relative">
                <Button 
                  onClick={handleUpgradeToPro}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  {t('Kor u qaad Pro - $10', 'Upgrade to Pro - $10')}
                </Button>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-black font-medium animate-pulse">
                    {t('Ku Badbaadi 50%!', 'Save 50%!')}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to Pro</DialogTitle>
              <DialogDescription>
                Upgrade to Pro for unlimited ads and priority support.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-accent rounded-lg">
                <h3 className="font-semibold mb-2">Payment Details</h3>
                <p><strong>Amount:</strong> $10</p>
                <p><strong>Payment Method:</strong> M-Pesa</p>
                <p><strong>Pay to:</strong> +254757872221</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please send the payment to the number above and confirm below.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setShowPaymentConfirm(true);
                  }}
                  className="flex-1"
                >
                  I've Made Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Confirmation Dialog */}
        <Dialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                Please confirm that you have made the payment of $10 to +254757872221
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePaymentConfirm}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Processing..." : "Yes, I Confirm Payment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Settings;