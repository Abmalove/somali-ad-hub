import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { UserPlus, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Register = () => {
  const { t } = useLanguage();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('Khalad', 'Error'),
        description: t('Sirta lama aha isku mid', 'Passwords do not match'),
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp(formData.email, formData.password);
      toast({
        title: t('Guuleysatay!', 'Success!'),
        description: t('Akoonka waa la abuuray', 'Account created successfully')
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: t('Khalad', 'Error'),
        description: error.message || t('Khalad ayaa dhacay', 'An error occurred'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <LanguageToggle />
      
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <UserPlus className="h-6 w-6" />
            {t('Abuur Akoon', 'Create Account')}
          </CardTitle>
          <p className="text-muted-foreground">
            {t('Bilow iibinta iyo iibsashada', 'Start selling and buying')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('Email', 'Email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('Gali email-kaaga', 'Enter your email')}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">{t('Sirta', 'Password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('Gali sirta', 'Enter your password')}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">{t('Xaqiiji Sirta', 'Confirm Password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder={t('Dib u gali sirta', 'Re-enter your password')}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('Sugaya...', 'Loading...') : t('Abuur Akoon', 'Create Account')}
            </Button>
          </form>
          
          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('Ma leedahay akoon?', 'Already have an account?')}
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                {t('Soo Gal', 'Login')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;