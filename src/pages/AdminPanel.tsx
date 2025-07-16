import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BottomNavigation } from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, XCircle, Eye, Settings, Users, Search, Store } from 'lucide-react';
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
      const { data, error } = await supabase
        .from("payment_approvals")
        .select(`
          *,
          profiles(email)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payment approvals:", error);
        toast({
          title: t('Khalad', 'Error'),
          description: t('Khalad ayaa dhacay', 'Failed to fetch payment approvals'),
          variant: 'destructive'
        });
      } else {
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

  const handleAdApproval = async (adId: string, action: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: action })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t(`Xayeysiiska waa la ${action === 'approved' ? 'aqbalay' : 'diiday'}`, 
                      `Ad has been ${action === 'approved' ? 'approved' : 'rejected'}`)
      });

      fetchPendingAds();
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

      fetchApprovalRequests();
      fetchAllUsers();
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
    const { error } = await supabase
      .from("payment_approvals")
      .update({ 
        status,
        admin_notes: status === 'confirmed' ? 'Payment verified and approved' : 'Payment rejected'
      })
      .eq("id", paymentId);

    if (error) {
      console.error("Error updating payment:", error);
      toast({
        title: t('Khalad', 'Error'),
        description: t('Khalad ayaa dhacay', 'Failed to update payment status'),
        variant: 'destructive'
      });
      return;
    }

    // If payment is confirmed, update user subscription if it's a pro upgrade
    if (status === 'confirmed') {
      const payment = paymentApprovals.find(p => p.id === paymentId);
      if (payment?.payment_type === 'pro_upgrade') {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ subscription_plan: 'pro' })
          .eq("user_id", payment.user_id);

        if (profileError) {
          console.error("Error updating user subscription:", profileError);
          toast({
            title: t('Khalad', 'Error'),
            description: t('Khalad ayaa dhacay', 'Payment approved but failed to update subscription'),
            variant: 'destructive'
          });
          return;
        }
      }
    }

    toast({
      title: t('Guuleysatay!', 'Success!'),
      description: t(`Lacagta waa la ${status === 'confirmed' ? 'aqbalay' : 'diiday'}`, `Payment ${status}`)
    });
    fetchPaymentApprovals();
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
                  <div className="space-y-4">
                    {pendingAds.map((ad) => (
                      <div key={ad.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{ad.title}</h3>
                            <p className="text-sm text-muted-foreground">{ad.shop_name} • {ad.region}</p>
                            <p className="text-sm font-medium">{ad.currency} {ad.price.toLocaleString()}</p>
                          </div>
                          <Badge variant="secondary">{ad.category}</Badge>
                        </div>
                        <p className="text-sm mb-4 line-clamp-2">{ad.description}</p>
                        <div className="flex gap-2">
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Approvals Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentApprovals.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <p className="text-sm">
                        <strong>Email:</strong> {payment.profiles?.email || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>Type:</strong> {payment.payment_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm">
                        <strong>Amount:</strong> ${payment.amount}
                      </p>
                      <p className="text-sm">
                        <strong>Shop Phone:</strong> {payment.payment_phone}
                      </p>
                      <p className="text-sm">
                        <strong>Status:</strong> 
                        <span className={`ml-1 ${payment.status === 'pending' ? 'text-yellow-600' : payment.status === 'confirmed' ? 'text-green-600' : 'text-red-600'}`}>
                          {payment.status}
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong>User Confirmed:</strong> {payment.payment_confirmed_by_user ? 'Yes' : 'No'}
                      </p>
                      {payment.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={() => handlePaymentAction(payment.id, "confirmed")}
                            size="sm"
                          >
                            Approve Payment
                          </Button>
                          <Button
                            onClick={() => handlePaymentAction(payment.id, "rejected")}
                            variant="destructive"
                            size="sm"
                          >
                            Reject Payment
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {paymentApprovals.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No pending payments to review
                    </p>
                  )}
                </div>
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