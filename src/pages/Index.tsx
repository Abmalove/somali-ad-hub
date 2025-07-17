import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { HeroSection } from '@/components/HeroSection';
import { ShopSetup } from '@/components/ShopSetup';
import { NotificationSystem } from '@/components/NotificationSystem';
import { categories } from '@/data/categories';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, TrendingUp, MapPin, Phone, Star, Eye } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  region: string;
  image_urls: string[] | null;
  is_boosted: boolean;
  is_highlighted: boolean;
  shop_name: string;
  phone: string;
  created_at: string;
}

const Index = () => {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [needsShopSetup, setNeedsShopSetup] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (user) {
      checkShopSetup();
    }
  }, [user]);

  const checkShopSetup = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_setup_completed')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      setNeedsShopSetup(!profile?.shop_setup_completed);
    } catch (error) {
      console.error('Error checking shop setup:', error);
    }
  };

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'approved')
        .order('is_highlighted', { ascending: false })
        .order('is_boosted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = searchTerm === '' || 
                         ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || ad.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAdClick = (ad: Ad) => {
    navigate(`/ad/${ad.id}`);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? t(category.soName, category.enName) : categoryId;
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <LanguageToggle />
        <Card className="w-full max-w-md shadow-medium">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              🛒 {t('Suuqa Soomaalida', 'Somali Marketplace')}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {t('Suuqa ugu weyn ee Soomaalida online', 'The largest Somali marketplace online')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/login')} className="w-full">
              {t('Soo Gal', 'Login')}
            </Button>
            <Button onClick={() => navigate('/register')} variant="outline" className="w-full">
              {t('Abuur Akoon', 'Create Account')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsShopSetup && user) {
    return <ShopSetup user={user} onComplete={() => setNeedsShopSetup(false)} />;
  }

  return (
    <div className="min-h-screen pb-20" style={{background: "linear-gradient(180deg, hsl(210 100% 40%), hsl(0 0% 100%))"}}>
      <div className="flex justify-between items-center p-4">
        <LanguageToggle />
        <NotificationSystem />
      </div>
      
      {/* Hero Section */}
      <div className="text-white p-6" style={{background: "hsl(210 100% 40%)"}}>
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            🛒 {t('Suuqa Soomaalida', 'Somali Marketplace')}
          </h1>
          <p className="text-white/80 mb-4">
            {t('Iib, iibso, oo hel wax walba oo aad u baahan tahay', 'Sell, buy, and find everything you need')}
          </p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('Raadi alaab, baabuur, shaqo...', 'Search for items, cars, jobs...')}
              className="pl-10 bg-background"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Categories */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('Qaybaha', 'Categories')}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
            >
              {t('Dhammaan', 'All')}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-xs"
              >
                {category.icon} {t(category.soName, category.enName)}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Post Button */}
        <Button 
          onClick={() => navigate('/post')}
          className="w-full h-12 text-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('Dhig Xayeysiis Cusub', 'Post New Ad')}
        </Button>

        {/* Ads Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('Xayeysiisyada Cusub', 'Latest Ads')} ({filteredAds.length})
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-2 w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAds.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">
                  {t('Xayeysiis la heli waayay', 'No ads found')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAds.map((ad) => (
                <Card 
                  key={ad.id} 
                  className={`cursor-pointer transition-transform hover:scale-105 ${
                    ad.is_highlighted ? 'ring-2 ring-accent shadow-medium' : 'shadow-soft'
                  }`}
                  onClick={() => handleAdClick(ad)}
                >
                  {/* Image */}
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    {ad.image_urls && ad.image_urls.length > 0 ? (
                      <img
                        src={ad.image_urls[0]}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-4xl">
                          {categories.find(cat => cat.id === ad.category)?.icon || '📦'}
                        </span>
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {ad.is_highlighted && (
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">
                          ⭐ {t('Muuqdo', 'Featured')}
                        </Badge>
                      )}
                      {ad.is_boosted && (
                        <Badge variant="secondary" className="bg-primary text-primary-foreground">
                          🚀 {t('Boost', 'Boost')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{ad.title}</h3>
                    <p className="text-2xl font-bold text-primary mb-2">
                      {formatPrice(ad.price, ad.currency)}
                    </p>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>{getCategoryName(ad.category)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{ad.region}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span>{ad.shop_name}</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      <Phone className="h-3 w-3 mr-1" />
                      {t('Wac', 'Call')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Index;
