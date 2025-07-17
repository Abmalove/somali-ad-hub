import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, XCircle, Eye, Settings, Users, Search, Store, ImageIcon, Phone, Calendar, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AdminPanel = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [pendingAds, setPendingAds] = useState<any[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [paymentApprovals, setPaymentApprovals] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userAds, setUserAds] = useState<any[]>([]);
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [userApprovals, setUserApprovals] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingAds();
      fetchApprovalRequests();
      fetchPaymentApprovals();
      fetchAllUsers();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.subscription_plan === 'admin') {
        setIsAdmin(true);
      } else {
        navigate('/');
        toast({
          title: t('Ogolaansho la\'aan', 'Access Denied'),
          description: t('Maamule kaliya ayaa arki kara boggan', 'Only admins can access this page'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  const fetchPendingAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingAds(data || []);
    } catch (error) {
      console.error('Error fetching pending ads:', error);
    }
  };

  const fetchApprovalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_approvals')
        .select(`
          *,
          profiles(email, shop_name, phone)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApprovalRequests(data || []);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    }
  };

  const fetchPaymentApprovals = async () => {
    try {
      console.log('Fetching payment approvals...');
      const { data, error } = await supabase
        .from("payment_approvals")
        .select(`
          *,
          profiles(email, shop_name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error fetching payment approvals:", error);
        toast({
          title: t('Khalad', 'Error'),
          description: t('Khalad ayaa dhacay', 'Failed to fetch payment approvals'),
          variant: 'destructive'
        });
      } else {
        console.log('Payment approvals fetched:', data);
        setPaymentApprovals(data || []);
      }
    } catch (error) {
      console.error('Error fetching payment approvals:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserAds = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserAds(data || []);
    } catch (error) {
      console.error('Error fetching user ads:', error);
    }
  };

  const fetchUserPayments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_approvals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserPayments(data || []);
    } catch (error) {
      console.error('Error fetching user payments:', error);
    }
  };

  const fetchUserApprovals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_approvals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserApprovals(data || []);
    } catch (error) {
      console.error('Error fetching user approvals:', error);
    }
  };

  const handleAdApproval = async (adId: string, action: 'approved' | 'rejected') => {
    if (!adId) {
      console.error('No ad ID provided');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Updating ad:', adId, 'to status:', action);
      
      const { data, error } = await supabase
        .from('ads')
        .update({ status: action })
        .eq('id', adId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Updated ad data:', data);

      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t(`Xayeysiiska waa la ${action === 'approved' ? 'aqbalay' : 'diiday'}`, 
                      `Ad has been ${action === 'approved' ? 'approved' : 'rejected'}`)
      });

      // Refresh all data
      await Promise.all([
        fetchPendingAds(),
        fetchAllUsers()
      ]);
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'An error occurred'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionApproval = async (requestId: string, action: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      const request = approvalRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update approval request
      const { error: approvalError } = await supabase
        .from('admin_approvals')
        .update({ 
          status: action,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (approvalError) throw approvalError;

      // If approved, update user's subscription
      if (action === 'approved') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (request.subscription_duration || 30));

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ subscription_plan: 'pro' })
          .eq('user_id', request.user_id);

        if (profileError) throw profileError;

        // Update the approval with expiry date
        await supabase
          .from('admin_approvals')
          .update({ subscription_expires_at: expiresAt.toISOString() })
          .eq('id', requestId);
      }

      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t(`Codsiga waa la ${action === 'approved' ? 'aqbalay' : 'diiday'}`, 
                      `Request has been ${action === 'approved' ? 'approved' : 'rejected'}`)
      });

      // Refresh all data
      await Promise.all([
        fetchApprovalRequests(),
        fetchAllUsers()
      ]);
    } catch (error) {
      console.error('Error handling subscription approval:', error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'An error occurred'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (paymentId: string, status: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("payment_approvals")
        .update({ 
          status,
          admin_notes: status === 'confirmed' ? 'Payment verified and approved' : 'Payment rejected'
        })
        .eq("id", paymentId);

      if (error) throw error;

      // If payment is confirmed, update user subscription if it's a pro upgrade
      if (status === 'confirmed') {
        const payment = paymentApprovals.find(p => p.id === paymentId);
        if (payment?.payment_type === 'pro_upgrade') {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ subscription_plan: 'pro' })
            .eq("user_id", payment.user_id);

          if (profileError) throw profileError;
        }
      }

      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t(`Lacagta waa la ${status === 'confirmed' ? 'aqbalay' : 'diiday'}`, `Payment ${status}`)
      });
      
      // Refresh all data
      await Promise.all([
        fetchPaymentApprovals(),
        fetchAllUsers()
      ]);
    } catch (error) {
      console.error("Error updating payment:", error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'Failed to update payment status'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('Sugaya...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <LanguageToggle />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-medium mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('Xarunta Maaraynta', 'Admin Panel')}
            </CardTitle>
          </CardHeader>
        </Card>

        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('Xayeysiisyo', 'Ads')}
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('Lacagaha', 'Payments')}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('Isticmaalka', 'Subscriptions')}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('Isticmaalayaasha', 'Users')}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('Farriimaad', 'Messages')}
            </TabsTrigger>
          </TabsList>

          {/* Pending Ads Tab */}
          <TabsContent value="ads">
            <Card>
              <CardHeader>
                <CardTitle>{t('Xayeysiisyo Sugaya Oggolaansho', 'Pending Ads')} ({pendingAds.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingAds.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('Ma jiraan xayeysiisyo sugaya', 'No pending ads')}
                  </p>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-6 pr-4">
                      {pendingAds.map((ad) => (
                        <Card key={ad.id} className="border-l-4 border-l-yellow-500">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-2">{ad.title}</h3>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Store className="h-4 w-4" />
                                    {ad.shop_name}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    {ad.region}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(ad.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    {ad.phone}
                                  </div>
                                </div>
                                <p className="text-xl font-bold text-primary mb-2">
                                  {ad.currency} {ad.price.toLocaleString()}
                                </p>
                              </div>
                              <Badge variant="outline" className="ml-4">{ad.category}</Badge>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-sm leading-relaxed">{ad.description}</p>
                            </div>

                            {/* Ad Images */}
                            {ad.image_urls && ad.image_urls.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <ImageIcon className="h-4 w-4" />
                                  {t('Sawirrada', 'Images')} ({ad.image_urls.length})
                                </h4>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                  {ad.image_urls.map((url: string, index: number) => (
                                    <Dialog key={index}>
                                      <DialogTrigger asChild>
                                        <img
                                          src={url}
                                          alt={`Ad image ${index + 1}`}
                                          className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                        />
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl">
                                        <DialogHeader>
                                          <DialogTitle>{t('Sawirka', 'Image')} {index + 1}</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex justify-center">
                                          <img
                                            src={url}
                                            alt={`Ad image ${index + 1}`}
                                            className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                          />
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Additional Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                              {ad.brand && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Brand</span>
                                  <p className="text-sm">{ad.brand}</p>
                                </div>
                              )}
                              {ad.model && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Model</span>
                                  <p className="text-sm">{ad.model}</p>
                                </div>
                              )}
                              {ad.year && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Year</span>
                                  <p className="text-sm">{ad.year}</p>
                                </div>
                              )}
                              {ad.condition && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Condition</span>
                                  <p className="text-sm">{ad.condition}</p>
                                </div>
                              )}
                              {ad.job_title && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Job Title</span>
                                  <p className="text-sm">{ad.job_title}</p>
                                </div>
                              )}
                              {ad.experience && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Experience</span>
                                  <p className="text-sm">{ad.experience}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                              <Button 
                                size="sm" 
                                onClick={() => handleAdApproval(ad.id, 'approved')}
                                disabled={loading}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t('Aqbal', 'Approve')}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleAdApproval(ad.id, 'rejected')}
                                disabled={loading}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {t('Diid', 'Reject')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Approvals Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>{t('Ansixinta Lacagaha', 'Payment Approvals')} ({paymentApprovals.filter(p => p.status === 'pending').length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {/* Pending Payments */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 text-yellow-600">
                        {t('Lacago Sugaya', 'Pending Payments')} ({paymentApprovals.filter(p => p.status === 'pending').length})
                      </h3>
                      {paymentApprovals.filter(p => p.status === 'pending').map((payment) => (
                        <Card key={payment.id} className="border-l-4 border-l-yellow-500 mb-4">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium">
                                  {t('Email', 'Email')}: <span className="font-normal">{payment.profiles?.email || 'N/A'}</span>
                                </p>
                                <p className="text-sm font-medium">
                                  {t('Nooca', 'Type')}: <span className="font-normal">{payment.payment_type.replace('_', ' ')}</span>
                                </p>
                                <p className="text-sm font-medium">
                                  {t('Lacagta', 'Amount')}: <span className="font-normal text-lg text-primary">${payment.amount}</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {t('Taleefanka Dukaanka', 'Shop Phone')}: <span className="font-normal">{payment.payment_phone}</span>
                                </p>
                                <p className="text-sm font-medium">
                                  {t('Xaqiijinta Isticmaalaha', 'User Confirmed')}: 
                                  <Badge variant={payment.payment_confirmed_by_user ? 'default' : 'secondary'} className="ml-2">
                                    {payment.payment_confirmed_by_user ? 'Yes' : 'No'}
                                  </Badge>
                                </p>
                                <p className="text-sm font-medium">
                                  {t('Taariikh', 'Created')}: <span className="font-normal">{new Date(payment.created_at).toLocaleDateString()}</span>
                                </p>
                              </div>
                            </div>
                            {payment.shop_name && (
                              <p className="text-sm font-medium mb-4">
                                {t('Magaca Dukaanka', 'Shop Name')}: <span className="font-normal">{payment.shop_name}</span>
                              </p>
                            )}
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handlePaymentAction(payment.id, "confirmed")}
                                size="sm"
                                disabled={loading}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t('Aqbal Lacagta', 'Approve Payment')}
                              </Button>
                              <Button
                                onClick={() => handlePaymentAction(payment.id, "rejected")}
                                variant="destructive"
                                size="sm"
                                disabled={loading}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {t('Diid Lacagta', 'Reject Payment')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Processed Payments */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
                        {t('Lacago la Fuliyay', 'Processed Payments')} ({paymentApprovals.filter(p => p.status !== 'pending').length})
                      </h3>
                      {paymentApprovals.filter(p => p.status !== 'pending').map((payment) => (
                        <Card key={payment.id} className={`border-l-4 mb-4 ${payment.status === 'confirmed' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{payment.profiles?.email || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">{payment.payment_type.replace('_', ' ')} • ${payment.amount}</p>
                              </div>
                              <Badge variant={payment.status === 'confirmed' ? 'default' : 'destructive'}>
                                {payment.status}
                              </Badge>
                            </div>
                            {payment.admin_notes && (
                              <p className="text-sm text-muted-foreground">{payment.admin_notes}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {paymentApprovals.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        {t('Ma jiraan lacago la raadayo', 'No payments to review')}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Approvals Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>{t('Codsiyada Pro', 'Pro Subscription Requests')} ({approvalRequests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {approvalRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('Ma jiraan codsyo cusub', 'No pending requests')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {approvalRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{request.profiles?.email}</h3>
                            <p className="text-sm text-muted-foreground">
                              {t('Nooca:', 'Type:')} {request.approval_type}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t('Lacagta:', 'Amount:')} ${request.amount}
                            </p>
                          </div>
                          <Badge variant="secondary">{request.status}</Badge>
                        </div>
                        {request.notes && (
                          <p className="text-sm mb-4 text-muted-foreground">{request.notes}</p>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSubscriptionApproval(request.id, 'approved')}
                            disabled={loading}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('Aqbal', 'Approve')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleSubscriptionApproval(request.id, 'rejected')}
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t('Diid', 'Reject')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t('Dhammaan Isticmaalayaasha', 'All Users')} ({allUsers.length})</CardTitle>
                <div className="flex items-center gap-2 mt-4">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder={t('Raadi isticmaalayaasha...', 'Search users...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allUsers
                    .filter(user => 
                      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (user.shop_name && user.shop_name.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((user) => (
                      <Dialog key={user.id}>
                        <DialogTrigger asChild>
                          <div 
                            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setSelectedUser(user);
                              fetchUserAds(user.user_id);
                              fetchUserPayments(user.user_id);
                              fetchUserApprovals(user.user_id);
                            }}
                          >
                            <div>
                              <p className="font-medium">{user.email}</p>
                              {user.shop_name && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Store className="h-3 w-3" />
                                  {user.shop_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={user.subscription_plan === 'pro' ? 'default' : 'secondary'}>
                                {user.subscription_plan || 'free'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {user.ad_count || 0} {t('xayeysiis', 'ads')}
                              </span>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{t('Faahfaahinta Isticmaalaha', 'User Details')}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-semibold mb-2">{t('Macluumaadka Guud', 'General Information')}</h3>
                                <div className="space-y-2">
                                  <p><strong>Email:</strong> {user.email}</p>
                                  <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                                  <p><strong>Subscription:</strong> {user.subscription_plan || 'free'}</p>
                                  <p><strong>Total Ads:</strong> {user.ad_count || 0}</p>
                                </div>
                              </div>
                              {user.shop_name && (
                                <div>
                                  <h3 className="font-semibold mb-2">{t('Macluumaadka Dukaanka', 'Shop Information')}</h3>
                                  <div className="space-y-2">
                                    <p><strong>Shop Name:</strong> {user.shop_name}</p>
                                    <p><strong>Region:</strong> {user.shop_region || 'N/A'}</p>
                                    <p><strong>Setup Complete:</strong> {user.shop_setup_completed ? 'Yes' : 'No'}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">{t('Xayeysiisyada Isticmaalaha', 'User Ads')} ({userAds.length})</h3>
                              {userAds.length === 0 ? (
                                <p className="text-muted-foreground">{t('Ma jiraan xayeysiisyo', 'No ads found')}</p>
                              ) : (
                                <div className="space-y-2">
                                  {userAds.map((ad) => (
                                    <div key={ad.id} className="border rounded-lg p-3">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium">{ad.title}</h4>
                                          <p className="text-sm text-muted-foreground">{ad.category} • {ad.currency} {ad.price.toLocaleString()}</p>
                                        </div>
                                        <Badge variant={ad.status === 'approved' ? 'default' : ad.status === 'pending' ? 'secondary' : 'destructive'}>
                                          {ad.status}
                                        </Badge>
                                      </div>
                                      <p className="text-sm mt-2 line-clamp-2">{ad.description}</p>
                                      {ad.status === 'pending' && (
                                        <div className="flex gap-2 mt-2">
                                          <Button 
                                            size="sm" 
                                            onClick={() => handleAdApproval(ad.id, 'approved')}
                                            disabled={loading}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            {t('Aqbal', 'Approve')}
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="destructive"
                                            onClick={() => handleAdApproval(ad.id, 'rejected')}
                                            disabled={loading}
                                          >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            {t('Diid', 'Reject')}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <h3 className="font-semibold mb-2">{t('Lacagaha Sugaya', 'Pending Payments')} ({userPayments.filter(p => p.status === 'pending').length})</h3>
                              {userPayments.filter(p => p.status === 'pending').length === 0 ? (
                                <p className="text-muted-foreground">{t('Ma jiraan lacago sugaya', 'No pending payments')}</p>
                              ) : (
                                <div className="space-y-2">
                                  {userPayments.filter(p => p.status === 'pending').map((payment) => (
                                    <div key={payment.id} className="border rounded-lg p-3">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium">{payment.payment_type.replace('_', ' ')}</h4>
                                          <p className="text-sm text-muted-foreground">${payment.amount} • {payment.payment_phone}</p>
                                        </div>
                                        <Badge variant="secondary">{payment.status}</Badge>
                                      </div>
                                      <div className="flex gap-2 mt-2">
                                        <Button 
                                          size="sm" 
                                          onClick={() => handlePaymentAction(payment.id, 'confirmed')}
                                          disabled={loading}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          {t('Aqbal', 'Approve')}
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => handlePaymentAction(payment.id, 'rejected')}
                                          disabled={loading}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          {t('Diid', 'Reject')}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <h3 className="font-semibold mb-2">{t('Codsiyada Pro', 'Pro Plan Requests')} ({userApprovals.filter(a => a.status === 'pending').length})</h3>
                              {userApprovals.filter(a => a.status === 'pending').length === 0 ? (
                                <p className="text-muted-foreground">{t('Ma jiraan codsyo Pro', 'No pending pro requests')}</p>
                              ) : (
                                <div className="space-y-2">
                                  {userApprovals.filter(a => a.status === 'pending').map((approval) => (
                                    <div key={approval.id} className="border rounded-lg p-3">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium">{approval.approval_type.replace('_', ' ')}</h4>
                                          <p className="text-sm text-muted-foreground">${approval.amount} • {approval.subscription_duration} days</p>
                                        </div>
                                        <Badge variant="secondary">{approval.status}</Badge>
                                      </div>
                                      {approval.notes && (
                                        <p className="text-sm mt-2 text-muted-foreground">{approval.notes}</p>
                                      )}
                                      <div className="flex gap-2 mt-2">
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleSubscriptionApproval(approval.id, 'approved')}
                                          disabled={loading}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          {t('Aqbal', 'Approve')}
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => handleSubscriptionApproval(approval.id, 'rejected')}
                                          disabled={loading}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          {t('Diid', 'Reject')}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>{t('Farriimaadaha', 'Messages')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  {t('Farriimaadaha waxaa laga maareeyaa bogga khaaska ah', 'Messages are managed from the dedicated messages page')}
                  <div className="mt-4">
                    <Button onClick={() => navigate('/messages')}>
                      {t('Aad u farriimaadaha', 'Go to Messages')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default AdminPanel;