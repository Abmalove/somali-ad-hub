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
import { User, Store, LogOut, Edit, Plus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Profile = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<any>(null);
  const [userAds, setUserAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserAds();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserAds(data || []);
    } catch (error) {
      console.error('Error fetching user ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'An error occurred'),
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">{t('La aqbalay', 'Approved')}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{t('Sugitaan', 'Pending')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('La diiday', 'Rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <LanguageToggle />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('Profile', 'Profile')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{user.email}</p>
                {profile?.shop_name && (
                  <div className="flex items-center gap-2 mt-1">
                    <Store className="h-4 w-4" />
                    <span className="text-muted-foreground">{profile.shop_name}</span>
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={() => navigate('/edit-profile')}>
                <Edit className="h-4 w-4 mr-2" />
                {t('Wax ka beddel', 'Edit')}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{userAds.length}</p>
                <p className="text-sm text-muted-foreground">{t('Xayeysiisyo', 'Ads')}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{profile?.subscription_plan || 'free'}</p>
                <p className="text-sm text-muted-foreground">{t('Plan', 'Plan')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => navigate('/post')} className="h-12">
            <Plus className="h-4 w-4 mr-2" />
            {t('Xayeysiis Cusub', 'New Ad')}
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="h-12">
            <LogOut className="h-4 w-4 mr-2" />
            {t('Ka Bax', 'Sign Out')}
          </Button>
        </div>

        {/* User Ads */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('Xayeysiisyadayda', 'My Ads')} ({userAds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-16 h-16 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : userAds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('Wali ma dhigan xayeysiis', "You haven't posted any ads yet")}
                </p>
                <Button onClick={() => navigate('/post')} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('Dhig Xayeysiiskaaga ugu horeya', 'Post your first ad')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {userAds.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <span className="text-xl">📦</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{ad.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ad.currency} {ad.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(ad.status)}
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/ad/${ad.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;