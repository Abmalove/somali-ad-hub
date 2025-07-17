import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Phone, MessageCircle, Star, MapPin, Heart, HeartOff, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/data/categories';

export const AdDetail = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    if (id) {
      fetchAd();
      fetchComments();
      fetchRatings();
      if (user) {
        checkFavorite();
        fetchUserRating();
      }
    }
  }, [id, user]);

  const fetchAd = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      setAd(data);
    } catch (error) {
      console.error('Error fetching ad:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!inner(shop_name, email)
        `)
        .eq('ad_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Fallback: fetch comments without profile data
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('comments')
          .select('*')
          .eq('ad_id', id)
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setComments(fallbackData || []);
      } catch (fallbackError) {
        console.error('Fallback comment fetch failed:', fallbackError);
      }
    }
  };

  const checkFavorite = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user?.id)
        .eq('ad_id', id)
        .single();

      setIsFavorite(!!data);
    } catch (error) {
      // Not a favorite
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: t('Khalad', 'Error'),
        description: t('Waa inaad galaan', 'You must be logged in'),
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', id);
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            ad_id: id
          });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !messageText.trim()) return;

    try {
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: ad.user_id,
          ad_id: id,
          message: messageText
        });

      setMessageText('');
      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Farriimaadka waa la diray', 'Message sent successfully')
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'Failed to send message'),
        variant: 'destructive'
      });
    }
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('ad_id', id);

      if (error) throw error;
      
      const ratings = data || [];
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        setAverageRating(sum / ratings.length);
        setTotalRatings(ratings.length);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchUserRating = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('ad_id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setUserRating(data.rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const submitRating = async (rating: number) => {
    if (!user || user.id === ad.user_id) return;

    try {
      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          ad_id: id,
          rating
        });

      if (error) throw error;

      setUserRating(rating);
      fetchRatings();
      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Qiimaynta waa la galiyey', 'Rating submitted successfully')
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'Failed to submit rating'),
        variant: 'destructive'
      });
    }
  };

  const addComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          ad_id: id,
          comment: newComment
        });

      setNewComment('');
      fetchComments();
      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Faallada waa la galiyey', 'Comment added successfully')
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'Failed to add comment'),
        variant: 'destructive'
      });
    }
  };

  const updateAdStatus = async (status: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      // Update local ad state
      setAd({ ...ad, status });
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'Failed to update ad status'),
        variant: 'destructive'
      });
    }
  };

  const deleteAd = async () => {
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Xayeysiiska waa la tirtiray', 'Ad deleted successfully')
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'Failed to delete ad'),
        variant: 'destructive'
      });
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? t(category.soName, category.enName) : categoryId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <LanguageToggle />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <LanguageToggle />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">
            {t('Xayeysiiska ma jiro', 'Ad not found')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <LanguageToggle />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('Dib u noqo', 'Back')}
            </Button>
          </div>

        {/* Ad Details */}
        <Card className="shadow-medium">
          <CardContent className="p-6">
            {/* Image Gallery */}
            {ad.image_urls && ad.image_urls.length > 0 && (
              <div className="mb-6">
                <img
                  src={ad.image_urls[0]}
                  alt={ad.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {ad.image_urls.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {ad.image_urls.slice(1).map((url: string, index: number) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${ad.title} ${index + 2}`}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Title and Price */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{ad.title}</h1>
                <div className="flex items-center gap-2 mb-2">
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
              <p className="text-3xl font-bold text-primary">
                {ad.currency} {ad.price.toLocaleString()}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getCategoryName(ad.category)}</Badge>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{ad.region}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-4 w-4" />
                <span>{ad.shop_name}</span>
              </div>
              {ad.brand && (
                <p className="text-sm text-muted-foreground">
                  <strong>{t('Nooca:', 'Brand:')} </strong>{ad.brand}
                </p>
              )}
              {ad.model && (
                <p className="text-sm text-muted-foreground">
                  <strong>{t('Qaabka:', 'Model:')} </strong>{ad.model}
                </p>
              )}
              {ad.year && (
                <p className="text-sm text-muted-foreground">
                  <strong>{t('Sanadka:', 'Year:')} </strong>{ad.year}
                </p>
              )}
              {ad.condition && (
                <p className="text-sm text-muted-foreground">
                  <strong>{t('Xaalka:', 'Condition:')} </strong>{ad.condition}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{t('Faahfaahin', 'Description')}</h3>
              <p className="text-muted-foreground">{ad.description}</p>
            </div>

            {/* Like/Share buttons below description */}
            <div className="flex justify-center gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={toggleFavorite}>
                {isFavorite ? <HeartOff className="h-4 w-4 mr-2" /> : <Heart className="h-4 w-4 mr-2" />}
                {t('Jecel', 'Like')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const shareUrl = window.location.href;
                  const shareText = `${ad.title} - ${ad.currency} ${ad.price.toLocaleString()}`;
                  
                  // Create share options
                  const shareOptions = [
                    {
                      name: 'WhatsApp',
                      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
                    },
                    {
                      name: 'Facebook',
                      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
                    },
                    {
                      name: 'Instagram',
                      url: `https://www.instagram.com/`
                    },
                    {
                      name: 'TikTok',
                      url: `https://www.tiktok.com/`
                    },
                    {
                      name: 'Gmail',
                      url: `mailto:?subject=${encodeURIComponent(ad.title)}&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
                    },
                    {
                      name: 'YouTube',
                      url: `https://www.youtube.com/`
                    }
                  ];

                  // Show options or use native share
                  if (navigator.share) {
                    navigator.share({
                      title: ad.title,
                      text: shareText,
                      url: shareUrl,
                    }).catch(() => {
                      // Fallback to showing options
                      showShareOptions(shareOptions);
                    });
                  } else {
                    showShareOptions(shareOptions);
                  }

                  function showShareOptions(options: any[]) {
                    const getIcon = (name: string) => {
                      switch(name) {
                        case 'WhatsApp': return '📱';
                        case 'Facebook': return '📘';
                        case 'Instagram': return '📷';
                        case 'TikTok': return '🎵';
                        case 'Gmail': return '📧';
                        case 'YouTube': return '📹';
                        default: return name[0];
                      }
                    };
                    
                    const getIconBg = (name: string) => {
                      switch(name) {
                        case 'WhatsApp': return 'bg-green-500';
                        case 'Facebook': return 'bg-blue-600';
                        case 'Instagram': return 'bg-pink-500';
                        case 'TikTok': return 'bg-black';
                        case 'Gmail': return 'bg-red-500';
                        case 'YouTube': return 'bg-red-600';
                        default: return 'bg-primary';
                      }
                    };
                    
                    const shareMenu = document.createElement('div');
                    shareMenu.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
                    shareMenu.innerHTML = `
                      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm w-full mx-4">
                        <h3 class="text-lg font-semibold mb-4 text-center">${t('Wadaag', 'Share')}</h3>
                        <div class="grid grid-cols-3 gap-3">
                          ${options.map(option => `
                             <a href="${option.url}" target="_blank" class="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                               <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-2 ${getIconBg(option.name)}">
                                 ${getIcon(option.name)}
                               </div>
                               <span class="text-xs text-center">${option.name}</span>
                             </a>
                          `).join('')}
                        </div>
                        <button class="w-full mt-4 py-2 px-4 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors" onclick="this.parentElement.parentElement.remove()">
                          ${t('Xir', 'Close')}
                        </button>
                      </div>
                    `;
                    document.body.appendChild(shareMenu);
                    
                    // Remove on click outside
                    shareMenu.addEventListener('click', (e) => {
                      if (e.target === shareMenu) {
                        shareMenu.remove();
                      }
                    });
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t('Wadaag', 'Share')}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button className="flex-1" asChild>
                <a href={`tel:${ad.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  {t('Wac', 'Call')} {ad.phone}
                </a>
              </Button>
              {user && user.id !== ad.user_id && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    // Scroll to message section
                    const messageSection = document.getElementById('message-section');
                    if (messageSection) {
                      messageSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t('Farriin', 'Message')}
                </Button>
              )}
            </div>

            {/* Ad Management - Only for ad owner */}
            {user && user.id === ad.user_id && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold mb-4">{t('Maamulka Xayeysiiska', 'Ad Management')}</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      await updateAdStatus('out_of_stock');
                      toast({
                        title: t('Guuleysatay!', 'Success!'),
                        description: t('Xayeysiiska waxaa lagu calaamadeeyay inuu dhamaday', 'Ad marked as out of stock')
                      });
                    }}
                  >
                    {t('Calaamadee Alaabta Dhamaaday', 'Mark as Out of Stock')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      await updateAdStatus('approved');
                      toast({
                        title: t('Guuleysatay!', 'Success!'),
                        description: t('Xayeysiiska waxaa lagu calaamadeeyay inuu dib u diyaar yahay', 'Ad marked as restocked')
                      });
                    }}
                  >
                    {t('Calaamadee Alaabta Dib u Yimaad', 'Mark as Restocked')}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      if (confirm(t('Ma hubtaa inaad tirtirto xayeysiiskan?', 'Are you sure you want to delete this ad?'))) {
                        await deleteAd();
                      }
                    }}
                  >
                    {t('Tirtir Xayeysiiska', 'Delete Ad')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send Message */}
        {user && user.id !== ad.user_id && (
          <Card id="message-section">
            <CardHeader>
              <CardTitle>{t('Dir Farriin', 'Send Message')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t('Qor farriimaadkaaga...', 'Write your message...')}
                  rows={3}
                />
                <Button onClick={sendMessage} disabled={!messageText.trim()}>
                  {t('Dir', 'Send')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Ratings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {t('Qiimeyn', 'Rating')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Display Average Rating */}
            {totalRatings > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({totalRatings} {t('qiimeyn', 'ratings')})</span>
              </div>
            )}

            {/* User Rating */}
            {user && user.id !== ad.user_id && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">
                    {userRating > 0 
                      ? t('Qiimeyntaada:', 'Your rating:') 
                      : t('Qiimee xayeysiiskan:', 'Rate this ad:')
                    }
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => submitRating(star)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Faallada', 'Comments')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Comment */}
            {user && (
              <div className="space-y-4 mb-6">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('Qor faallada...', 'Write a comment...')}
                  rows={2}
                />
                <Button onClick={addComment} disabled={!newComment.trim()}>
                  {t('Ku dar faallo', 'Add Comment')}
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">
                      {comment.profiles?.shop_name || comment.profiles?.email?.split('@')[0] || t('Isticmaale', 'User')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comment.comment}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {t('Wali faallo ma jirto', 'No comments yet')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};