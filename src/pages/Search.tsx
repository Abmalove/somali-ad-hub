import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { categories, regions } from '@/data/categories';
import { supabase } from '@/integrations/supabase/client';
import { Search as SearchIcon, Filter, MapPin, Star, Phone } from 'lucide-react';

export const Search = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    searchAds();
  }, [searchTerm, selectedCategory, selectedRegion, priceRange]);

  const searchAds = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ads')
        .select('*')
        .eq('status', 'approved');

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      if (selectedRegion) {
        query = query.eq('region', selectedRegion);
      }
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (max) {
          query = query.gte('price', min).lte('price', max);
        } else {
          query = query.gte('price', min);
        }
      }

      const { data, error } = await query
        .order('is_highlighted', { ascending: false })
        .order('is_boosted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error searching ads:', error);
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
        {/* Search Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SearchIcon className="h-6 w-6" />
            {t('Raadi', 'Search')}
          </h1>
          
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('Raadi alaab, baabuur, shaqo...', 'Search for items, cars, jobs...')}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4" />
              <span className="font-medium">{t('Sifeeyayaasha', 'Filters')}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Qaybta', 'Category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('Dhammaan', 'All Categories')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {t(category.soName, category.enName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Gobolka', 'Region')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('Dhammaan', 'All Regions')}</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Qiimaha', 'Price Range')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('Qiimo kasta', 'Any Price')}</SelectItem>
                  <SelectItem value="0-100">$0 - $100</SelectItem>
                  <SelectItem value="100-500">$100 - $500</SelectItem>
                  <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                  <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5000">$5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedCategory || selectedRegion || priceRange) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedRegion('');
                  setPriceRange('');
                }}
                className="mt-3"
              >
                {t('Ka saar sifeeyayaasha', 'Clear Filters')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {t('Natiijada', 'Results')} ({ads.length})
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
          ) : ads.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? t('Wax lama helin', 'No results found')
                    : t('Bilow raadinta', 'Start searching')
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map((ad) => (
                <Card 
                  key={ad.id} 
                  className={`cursor-pointer transition-transform hover:scale-105 ${
                    ad.is_highlighted ? 'ring-2 ring-accent' : ''
                  }`}
                >
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
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Search;