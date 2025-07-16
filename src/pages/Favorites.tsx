import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { categories } from '@/data/categories';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MapPin, Star, Phone } from 'lucide-react';

export const Favorites = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          ads (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? t(category.soName, category.enName) : categoryId;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <LanguageToggle />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6" />
          {t('Jecelka', 'Favorites')} ({favorites.length})
        </h1>

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
        ) : favorites.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {t('Wali ma jeclayn alaab', "You haven't favorited any items yet")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((favorite) => {
              const ad = favorite.ads;
              if (!ad) return null;
              
              return (
                <Card key={favorite.id} className="cursor-pointer transition-transform hover:scale-105">
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
                    
                    <div className="absolute top-2 left-2 flex gap-1">
                      {ad.is_highlighted && (
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">
                          ⭐
                        </Badge>
                      )}
                      {ad.is_boosted && (
                        <Badge variant="secondary" className="bg-primary text-primary-foreground">
                          🚀
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{ad.title}</h3>
                    <p className="text-2xl font-bold text-primary mb-2">
                      {ad.currency} {ad.price.toLocaleString()}
                    </p>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>{getCategoryName(ad.category)}</div>
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
              );
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Favorites;