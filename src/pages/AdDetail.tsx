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

  useEffect(() => {
    if (id) {
      fetchAd();
      fetchComments();
      if (user) {
        checkFavorite();
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
          profiles!comments_user_id_fkey(shop_name)
        `)
        .eq('ad_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleFavorite}>
              {isFavorite ? <HeartOff className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
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

            {/* Actions */}
            <div className="flex gap-4">
              <Button className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                {t('Wac', 'Call')} {ad.phone}
              </Button>
              {user && user.id !== ad.user_id && (
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t('Farriin', 'Message')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Send Message */}
        {user && user.id !== ad.user_id && (
          <Card>
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
                    <span className="font-medium">{comment.profiles?.shop_name || t('Isticmaale', 'User')}</span>
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