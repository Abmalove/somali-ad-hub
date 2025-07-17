import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, Star, Crown, Zap } from 'lucide-react';

interface SubscriptionPlansProps {
  currentPlan?: string;
  onUpgrade: () => void;
}

export const SubscriptionPlans = ({ currentPlan = 'free', onUpgrade }: SubscriptionPlansProps) => {
  const { t } = useLanguage();

  const plans = [
    {
      id: 'free',
      name: t('Bilaash', 'Free'),
      price: '$0',
      duration: t('/bil', '/month'),
      icon: <Star className="h-6 w-6" />,
      features: [
        t('5 xayeysiis bishiiba', '5 ads per month'),
        t('Taageero aasaasi ah', 'Basic support'),
        t('Profile gaarka ah', 'Basic profile'),
      ],
      limitations: [
        t('Ma heli kartid boost', 'No boost options'),
        t('Ma heli kartid highlight', 'No highlight options'),
      ],
      bgClass: 'bg-gray-50 dark:bg-gray-800',
      borderClass: 'border-gray-200 dark:border-gray-700',
    },
    {
      id: 'pro',
      name: t('Pro', 'Pro'),
      price: '$5',
      duration: t('/bil', '/month'),
      icon: <Crown className="h-6 w-6 text-yellow-500" />,
      popular: true,
      features: [
        t('Xayeysiis aan xadidnayn', 'Unlimited ads'),
        t('Taageero degdeg ah', 'Priority support'),
        t('Profile horumarsan', 'Advanced profile'),
        t('Analytics faahfaahsan', 'Detailed analytics'),
        t('Shop page gaarka ah', 'Custom shop page'),
        t('Messaging horumarsan', 'Advanced messaging'),
      ],
      bgClass: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
      borderClass: 'border-yellow-300 dark:border-yellow-600 border-2',
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative ${plan.bgClass} ${plan.borderClass} transition-all duration-300 hover:shadow-lg`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1">
                <Zap className="h-4 w-4 mr-1" />
                {t('Ugu fiican!', 'Most Popular!')}
              </Badge>
            </div>
          )}
          
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-2">
              {plan.icon}
            </div>
            <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">{plan.duration}</span>
            </div>
            {currentPlan === plan.id && (
              <Badge variant="secondary" className="mt-2">
                {t('Hadda la isticmaalayo', 'Current Plan')}
              </Badge>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
              
              {plan.limitations?.map((limitation, index) => (
                <div key={index} className="flex items-center gap-3 opacity-60">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs text-gray-500">✕</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{limitation}</span>
                </div>
              ))}
            </div>
            
            {plan.id === 'pro' && currentPlan !== 'pro' && (
              <Button 
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                {t('Pro-ga u bedel', 'Upgrade to Pro')}
              </Button>
            )}
            
            {plan.id === 'free' && currentPlan === 'pro' && (
              <Button variant="outline" className="w-full" disabled>
                {t('Hoos u dhac', 'Downgrade')}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};