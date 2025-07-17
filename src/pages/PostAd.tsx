import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ImageUpload } from '@/components/ImageUpload';
import { CVUpload } from '@/components/CVUpload';
import { categories, regions } from '@/data/categories';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PostAd = () => {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentType, setPaymentType] = useState<'boost' | 'boost_highlight' | 'pro_upgrade'>('boost');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [pendingAdData, setPendingAdData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    category: '',
    region: '',
    phone: '',
    shop_name: '',
    // Category specific fields
    job_title: '',
    salary: '',
    experience: '',
    brand: '',
    model: '',
    year: '',
    condition: '',
    // File uploads
    image_urls: [] as string[],
    cv_url: null as string | null
  });

  const [adOptions, setAdOptions] = useState({
    isBoost: false,
    isHighlight: false
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
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

      if (data) {
        setProfile(data);
        
        // Auto-fill shop name, region, and phone if user has a shop
        if (data.shop_name) {
          setFormData(prev => ({ 
            ...prev, 
            shop_name: data.shop_name,
            region: data.shop_region || prev.region,
            phone: data.phone || prev.phone
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.region || !formData.phone || !formData.shop_name) {
      toast({
        title: t('Khalad', 'Error'),
        description: t('Fadlan buuxi dhammaan goobaha muhiimka ah', 'Please fill all required fields'),
        variant: 'destructive'
      });
      return;
    }

    // For jobs category, CV is required
    if (formData.category === 'jobs' && !formData.cv_url) {
      toast({
        title: t('Khalad', 'Error'),
        description: t('CV waa lagama maarmaan shaqo codsiga', 'CV is required for job applications'),
        variant: 'destructive'
      });
      return;
    }

    // Check if user has reached free ad limit
    if (profile && profile.ad_count >= 5 && profile.subscription_plan === 'free') {
      setPaymentType('pro_upgrade');
      setPaymentAmount(10);
      setShowPaymentDialog(true);
      setPendingAdData(formData);
      return;
    }

    // Check if boost or highlight options require payment
    if (adOptions.isBoost || adOptions.isHighlight) {
      const amount = adOptions.isBoost && adOptions.isHighlight ? 15 : (adOptions.isBoost ? 10 : 8);
      const type = adOptions.isBoost && adOptions.isHighlight ? 'boost_highlight' : 'boost';
      setPaymentType(type);
      setPaymentAmount(amount);
      setShowPaymentDialog(true);
      setPendingAdData(formData);
      return;
    }

    await submitAd();
  };

  const submitAd = async (fromPayment = false) => {
    setLoading(true);
    
    try {
      // Determine ad status based on boost options
      // Only ads with boost or highlight options need approval
      const needsApproval = adOptions.isBoost || adOptions.isHighlight;
      const adStatus = needsApproval ? 'pending' : 'approved';
      
      const adData = {
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        category: formData.category,
        region: formData.region,
        phone: formData.phone,
        shop_name: formData.shop_name,
        image_urls: formData.image_urls,
        cv_url: formData.cv_url,
        // Category specific fields
        job_title: formData.job_title || null,
        salary: formData.salary || null,
        experience: formData.experience || null,
        brand: formData.brand || null,
        model: formData.model || null,
        year: formData.year || null,
        condition: formData.condition || null,
        // Ad options
        is_boosted: adOptions.isBoost,
        is_highlighted: adOptions.isHighlight,
        boost_expires_at: adOptions.isBoost || adOptions.isHighlight ? 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        status: adStatus
      };

      const { error } = await supabase
        .from('ads')
        .insert(adData);

      if (error) throw error;

      // Update user's ad count
      if (profile) {
        await supabase
          .from('profiles')
          .update({ ad_count: (profile.ad_count || 0) + 1 })
          .eq('user_id', user?.id);
      }

      let message;
      if (fromPayment) {
        message = "Payment submitted for approval! Your ad will be processed after payment verification.";
      } else if (needsApproval) {
        message = "Your boosted ad has been submitted for review";
      } else {
        message = "Your ad is now live!";
      }
      
      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Xayeysiiskaagu wuu la diray maaraynta', message)
      });
      
      navigate('/profile');
    } catch (error) {
      console.error('Error posting ad:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'An error occurred'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirm = async () => {
    setLoading(true);
    try {
      // Submit payment approval request
      const { error } = await supabase
        .from("payment_approvals")
        .insert([{
          user_id: user?.id,
          payment_type: paymentType,
          amount: paymentAmount,
          payment_phone: "+254757872221",
          payment_confirmed_by_user: true,
          shop_name: formData.shop_name || profile?.shop_name || 'Unknown Shop'
        }]);

      if (error) {
        console.error("Error submitting payment:", error);
        toast({
          title: t('Khalad', 'Error'),
          description: t('Khalad ayaa dhacay', 'Failed to submit payment. Please try again.'),
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // If it's a pro upgrade, update the pending ad data or submit ad
      if (paymentType === 'pro_upgrade') {
        if (pendingAdData) {
          await submitAd(true);
        } else {
          toast({
            title: t('Guuleysatay!', 'Success!'),
            description: t('Codsigaaga waa la diray maaraynta', 'Pro upgrade payment submitted for approval!')
          });
          navigate("/profile");
        }
      } else {
        // For boost payments, submit the ad
        await submitAd(true);
      }

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
    setLoading(false);
  };

  const renderCategoryFields = () => {
    switch (formData.category) {
      case 'jobs':
        return (
          <>
            <div>
              <Label htmlFor="job_title">{t('Shaqada', 'Job Title')}</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder={t('Gali magaca shaqada', 'Enter job title')}
              />
            </div>
            <div>
              <Label htmlFor="salary">{t('Mushaharka', 'Salary')}</Label>
              <Input
                id="salary"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder={t('Mushaharka/bil', 'Salary/month')}
              />
            </div>
            <div>
              <Label htmlFor="experience">{t('Khibradda', 'Experience Required')}</Label>
              <Select value={formData.experience} onValueChange={(value) => setFormData({ ...formData, experience: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Dooro khibradda', 'Select experience')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">{t('Bilow', 'Entry Level')}</SelectItem>
                  <SelectItem value="1-2">{t('1-2 sano', '1-2 years')}</SelectItem>
                  <SelectItem value="3-5">{t('3-5 sano', '3-5 years')}</SelectItem>
                  <SelectItem value="5+">{t('5+ sano', '5+ years')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Image Upload for jobs (replaced CV with images) */}
            <ImageUpload 
              onImagesChange={(urls) => setFormData({ ...formData, image_urls: urls })}
              maxImages={5}
              existingImages={formData.image_urls}
            />
          </>
        );
      
      case 'services':
        return (
          <>
            <div>
              <Label htmlFor="experience">{t('Khibradda', 'Experience')}</Label>
              <Select value={formData.experience} onValueChange={(value) => setFormData({ ...formData, experience: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Dooro khibradda', 'Select experience')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">{t('Bilow', 'Entry Level')}</SelectItem>
                  <SelectItem value="1-2">{t('1-2 sano', '1-2 years')}</SelectItem>
                  <SelectItem value="3-5">{t('3-5 sano', '3-5 years')}</SelectItem>
                  <SelectItem value="5+">{t('5+ sano', '5+ years')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* CV Upload for services */}
            <CVUpload 
              onCVChange={(url) => setFormData({ ...formData, cv_url: url })}
              existingCV={formData.cv_url}
            />
          </>
        );

      case 'vehicles':
      case 'phones':
      case 'electronics':
        return (
          <>
            <div>
              <Label htmlFor="brand">{t('Nooca/Brand', 'Brand')}</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder={t('Nooca alaabta', 'Item brand')}
              />
            </div>
            <div>
              <Label htmlFor="model">{t('Model', 'Model')}</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder={t('Model-ka', 'Model')}
              />
            </div>
            <div>
              <Label htmlFor="year">{t('Sannadka', 'Year')}</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder={t('2020', '2020')}
              />
            </div>
            <div>
              <Label htmlFor="condition">{t('Xaalada', 'Condition')}</Label>
              <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Dooro xaalada', 'Select condition')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t('Cusub', 'New')}</SelectItem>
                  <SelectItem value="like-new">{t('Cusub u eg', 'Like New')}</SelectItem>
                  <SelectItem value="good">{t('Xaal fiican', 'Good')}</SelectItem>
                  <SelectItem value="fair">{t('Xaal dhexdhexaad ah', 'Fair')}</SelectItem>
                  <SelectItem value="poor">{t('Xaal xun', 'Poor')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('Sugaya...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <LanguageToggle />
      
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('Dib u noqo', 'Go Back')}
        </Button>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('Xayeysiis Cusub', 'Post New Ad')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">{t('Cinwaanka', 'Title')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('Magaca alaabta', 'Item name')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">{t('Qiimaha', 'Price')} *</Label>
                  <div className="flex gap-2">
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="SOS">SOS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      required
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">{t('Qaybta', 'Category')} *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Dooro qaybta', 'Select category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {t(category.soName, category.enName)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region">{t('Gobolka', 'Region')} *</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })} required>
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

                <div>
                  <Label htmlFor="phone">{t('Lambarka Telefoonka', 'Phone Number')} *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+252..."
                    required
                  />
                </div>

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
              </div>

              <div>
                <Label htmlFor="description">{t('Sharaxaada', 'Description')} *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('Sharax alaabta si faahfaahsan...', 'Describe your item in detail...')}
                  rows={4}
                  required
                />
              </div>

              {/* Category specific fields */}
              {formData.category && renderCategoryFields()}

              {/* Image Upload */}
              {formData.category !== 'services' && (
                <ImageUpload 
                  onImagesChange={(urls) => setFormData({ ...formData, image_urls: urls })}
                  maxImages={5}
                  existingImages={formData.image_urls}
                />
              )}

              {/* Ad Options */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('Doorashada Xayeysiiska', 'Ad Options')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="boost"
                      checked={adOptions.isBoost}
                      onCheckedChange={(checked) => setAdOptions({ ...adOptions, isBoost: !!checked, isHighlight: false })}
                    />
                    <Label htmlFor="boost" className="text-sm">
                      🚀 {t('Boost Xayeysiiska ($10)', 'Boost Ad ($10)')} - {t('Kor u qaad xayeysiiskaaga', 'Promote your ad')}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="highlight"
                      checked={adOptions.isHighlight}
                      onCheckedChange={(checked) => setAdOptions({ ...adOptions, isHighlight: !!checked, isBoost: false })}
                    />
                    <Label htmlFor="highlight" className="text-sm">
                      ⭐ {t('Boost + Highlight ($15)', 'Boost + Highlight ($15)')} - {t('Ka dhig mid muuqda', 'Make it stand out')}
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Sugaya...', 'Loading...') : t('Dhig Xayeysiiska', 'Post Ad')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Required</DialogTitle>
            <DialogDescription>
              {paymentType === 'pro_upgrade' 
                ? "You have reached the limit of 5 free ads. Upgrade to Pro to continue posting."
                : `To ${paymentType === 'boost_highlight' ? 'boost and highlight' : 'boost'} your ad, payment is required.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-accent rounded-lg">
              <h3 className="font-semibold mb-2">Payment Details</h3>
              <p><strong>Amount:</strong> ${paymentAmount}</p>
              <p><strong>Payment Method:</strong> M-Pesa</p>
              <p><strong>Pay to:</strong> +254757872221</p>
              
              {/* Show Afripesa instructions only for Somalia region users */}
              {profile?.shop_region === 'Somalia' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    {t('Lacag-bixinta EVC/Afripesa', 'EVC/Afripesa Payment Instructions')}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    {t('Fur Chrome ama Safari ka dibna gal Afripesa account-kaaga:', 'Go to Chrome or Safari then login to your Afripesa account:')}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-blue-600 dark:text-blue-400">
                    <li>{t('Gali M-Pesa lambarka: +254757872221', 'Enter M-Pesa number: +254757872221')}</li>
                    <li>{t(`Dooro lacagta: $${paymentAmount} (${paymentType === 'pro_upgrade' ? 'Pro Plan' : paymentType === 'boost' ? 'Boost' : 'Boost + Highlight'})`, `Select amount: $${paymentAmount} (${paymentType === 'pro_upgrade' ? 'Pro Plan' : paymentType === 'boost' ? 'Boost' : 'Boost + Highlight'})`)}
                    </li>
                    <li>{t('Soo dhamaystir lacag-bixinta', 'Complete the payment')}</li>
                  </ol>
                </div>
              )}
              
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
              Please confirm that you have made the payment of ${paymentAmount} to +254757872221
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
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Processing..." : "Yes, I Confirm Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default PostAd;