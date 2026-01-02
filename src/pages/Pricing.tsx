import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, Crown, Rocket, Diamond, Award, Star, Gem, Shield, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  icon: React.ReactNode;
  badge: string;
  price: string;
  description: string;
  features: PlanFeature[];
  highlight?: boolean;
  tier: string;
}

const pricingPlans: PricingPlan[] = [
  // Tier 1: Plus/Pro/Elite
  {
    name: 'Plus',
    icon: <Diamond className="h-6 w-6" />,
    badge: '💎 Plus',
    price: 'Contact',
    description: 'Enhanced features for casual users',
    tier: 'Tier 1',
    features: [
      { name: 'Extended daily message limit (50/day)', included: true },
      { name: 'Access to Gemini models', included: true },
      { name: 'Priority support', included: true },
      { name: 'Image generation (20/day)', included: true },
      { name: 'Video generation', included: false },
      { name: 'Premium AI models', included: false },
    ],
  },
  {
    name: 'Pro',
    icon: <Rocket className="h-6 w-6" />,
    badge: '🚀 Pro',
    price: 'Contact',
    description: 'Professional features for power users',
    tier: 'Tier 1',
    highlight: true,
    features: [
      { name: 'Extended daily message limit (100/day)', included: true },
      { name: 'Access to all Gemini models', included: true },
      { name: 'Priority support', included: true },
      { name: 'Image generation (50/day)', included: true },
      { name: 'Video generation (10/day)', included: true },
      { name: 'GPT models access', included: true },
    ],
  },
  {
    name: 'Elite',
    icon: <Crown className="h-6 w-6" />,
    badge: '👑 Elite',
    price: 'Contact',
    description: 'Ultimate power for enthusiasts',
    tier: 'Tier 1',
    features: [
      { name: 'Unlimited daily messages', included: true },
      { name: 'Access to ALL AI models', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Unlimited image generation', included: true },
      { name: 'Unlimited video generation', included: true },
      { name: 'Early access to new features', included: true },
    ],
  },
  // Tier 2: Silver/Gold/Platinum
  {
    name: 'Silver',
    icon: <Award className="h-6 w-6" />,
    badge: '🥈 Silver',
    price: 'Contact',
    description: 'Great value for regular users',
    tier: 'Tier 2',
    features: [
      { name: 'Daily message limit (75/day)', included: true },
      { name: 'Access to Core + Lite models', included: true },
      { name: 'Standard support', included: true },
      { name: 'Image generation (30/day)', included: true },
      { name: 'Math solver access', included: true },
      { name: 'Claude models', included: false },
    ],
  },
  {
    name: 'Gold',
    icon: <Star className="h-6 w-6" />,
    badge: '🥇 Gold',
    price: 'Contact',
    description: 'Premium experience for serious users',
    tier: 'Tier 2',
    highlight: true,
    features: [
      { name: 'Daily message limit (150/day)', included: true },
      { name: 'Access to Core + Pro + Gemini models', included: true },
      { name: 'Priority support', included: true },
      { name: 'Image generation (75/day)', included: true },
      { name: 'Math solver + Video generation', included: true },
      { name: 'Claude Haiku access', included: true },
    ],
  },
  {
    name: 'Platinum',
    icon: <Gem className="h-6 w-6" />,
    badge: '💠 Platinum',
    price: 'Contact',
    description: 'Top-tier experience with all perks',
    tier: 'Tier 2',
    features: [
      { name: 'Unlimited daily messages', included: true },
      { name: 'Access to ALL AI models', included: true },
      { name: 'VIP priority support', included: true },
      { name: 'Unlimited image generation', included: true },
      { name: 'All features unlocked', included: true },
      { name: 'Private Discord channel access', included: true },
    ],
  },
  // Tier 3: Basic/Premium/VIP
  {
    name: 'Basic',
    icon: <Shield className="h-6 w-6" />,
    badge: '📦 Basic',
    price: 'Contact',
    description: 'Essential features for beginners',
    tier: 'Tier 3',
    features: [
      { name: 'Daily message limit (40/day)', included: true },
      { name: 'Access to Core model', included: true },
      { name: 'Email support', included: true },
      { name: 'Image generation (15/day)', included: true },
      { name: 'DeepThink mode', included: false },
      { name: 'Premium models', included: false },
    ],
  },
  {
    name: 'Premium',
    icon: <Sparkles className="h-6 w-6" />,
    badge: '⭐ Premium',
    price: 'Contact',
    description: 'Advanced features for growing needs',
    tier: 'Tier 3',
    highlight: true,
    features: [
      { name: 'Daily message limit (120/day)', included: true },
      { name: 'Access to Core + Gemini + DeepSeek', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Image generation (60/day)', included: true },
      { name: 'DeepThink + Reasoning modes', included: true },
      { name: 'Video generation (5/day)', included: true },
    ],
  },
  {
    name: 'VIP',
    icon: <Zap className="h-6 w-6" />,
    badge: '🌟 VIP',
    price: 'Contact',
    description: 'The ultimate Askify experience',
    tier: 'Tier 3',
    features: [
      { name: 'Unlimited daily messages', included: true },
      { name: 'Access to ALL AI models', included: true },
      { name: 'Dedicated support line', included: true },
      { name: 'Unlimited generations', included: true },
      { name: 'All features + early access', included: true },
      { name: 'Custom role badge color', included: true },
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  const groupedPlans = pricingPlans.reduce((acc, plan) => {
    if (!acc[plan.tier]) {
      acc[plan.tier] = [];
    }
    acc[plan.tier].push(plan);
    return acc;
  }, {} as Record<string, PricingPlan[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Askify Plans</h1>
            <p className="text-muted-foreground">Choose the perfect plan for your needs</p>
          </div>
        </div>

        {Object.entries(groupedPlans).map(([tier, plans]) => (
          <div key={tier} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              {tier}
              <Badge variant="secondary">{plans.length} plans</Badge>
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative transition-all duration-300 hover:shadow-lg ${
                    plan.highlight
                      ? 'border-primary shadow-md ring-2 ring-primary/20'
                      : ''
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {plan.icon}
                    </div>
                    <CardTitle className="text-xl">{plan.badge}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.price !== 'Contact' && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-2 text-sm ${
                            feature.included ? '' : 'text-muted-foreground line-through'
                          }`}
                        >
                          <Check
                            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              feature.included ? 'text-primary' : 'text-muted-foreground/50'
                            }`}
                          />
                          {feature.name}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.highlight ? 'default' : 'outline'}
                    >
                      Contact for Pricing
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 text-center">
          <Card className="inline-block p-6 max-w-2xl">
            <h3 className="text-xl font-bold mb-2">Need a Custom Plan?</h3>
            <p className="text-muted-foreground mb-4">
              Contact us for enterprise solutions or custom packages tailored to your specific needs.
            </p>
            <Button variant="outline">Contact Us</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
