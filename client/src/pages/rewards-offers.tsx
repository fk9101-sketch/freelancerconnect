import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Tag, Gift, Star, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";

interface Offer {
  id: string;
  title: string;
  description: string;
  discountCode: string;
  discount: string;
  validFrom: string;
  validUntil: string;
  category: string;
  isActive: boolean;
  isNew?: boolean;
  isPopular?: boolean;
}

const mockOffers: Offer[] = [
  {
    id: "1",
    title: "First Service Discount",
    description: "Get 20% off on your first service booking with any verified freelancer",
    discountCode: "FIRST20",
    discount: "20% OFF",
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    category: "New Users",
    isActive: true,
    isNew: true
  },
  {
    id: "2",
    title: "Weekend Special",
    description: "Book services on weekends and enjoy 15% additional discount",
    discountCode: "WEEKEND15",
    discount: "15% OFF",
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    category: "Weekend",
    isActive: true,
    isPopular: true
  },
  {
    id: "3",
    title: "Referral Bonus",
    description: "Refer a friend and both get ₹100 off on your next service",
    discountCode: "REFER100",
    discount: "₹100 OFF",
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    category: "Referral",
    isActive: true
  },
  {
    id: "4",
    title: "Premium Service Discount",
    description: "Special discount for premium service categories",
    discountCode: "PREMIUM25",
    discount: "25% OFF",
    validFrom: "2024-01-01",
    validUntil: "2024-06-30",
    category: "Premium",
    isActive: true
  },
  {
    id: "5",
    title: "Early Bird Offer",
    description: "Book services before 10 AM and get 10% extra discount",
    discountCode: "EARLY10",
    discount: "10% OFF",
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    category: "Timing",
    isActive: true
  },
  {
    id: "6",
    title: "Loyalty Reward",
    description: "For customers with 5+ completed services",
    discountCode: "LOYAL50",
    discount: "₹50 OFF",
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    category: "Loyalty",
    isActive: true
  }
];

export default function RewardsOffers() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Code copied!",
        description: `Discount code "${code}" has been copied to clipboard.`,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="bg-gradient-purple p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Rewards & Offers</h1>
        </div>
        <p className="text-primary-lighter">
          Discover amazing deals and discounts on local services
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {mockOffers.filter(offer => offer.isActive && !isExpired(offer.validUntil)).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Offers</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success mb-1">
                {mockOffers.filter(offer => offer.isNew).length}
              </div>
              <div className="text-sm text-muted-foreground">New Offers</div>
            </CardContent>
          </Card>
        </div>

        {/* Offers Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Available Offers</h2>
          
          {mockOffers
            .filter(offer => offer.isActive && !isExpired(offer.validUntil))
            .map((offer) => (
              <Card 
                key={offer.id} 
                className="bg-card border-border hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {offer.title}
                        </CardTitle>
                        {offer.isNew && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            NEW
                          </Badge>
                        )}
                        {offer.isPopular && (
                          <Badge className="bg-warning text-white text-xs flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            POPULAR
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {offer.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Discount Code Section */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Discount Code</div>
                        <div className="font-mono text-lg font-bold text-primary">
                          {offer.discountCode}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(offer.discountCode)}
                        className="flex items-center gap-2"
                      >
                        {copiedCode === offer.discountCode ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Offer Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Category</div>
                        <div className="text-sm font-medium">{offer.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 text-muted-foreground flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">₹</span>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Discount</div>
                        <div className="text-sm font-bold text-primary">{offer.discount}</div>
                      </div>
                    </div>
                  </div>

                  {/* Validity Period */}
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Valid from:</span>
                        <span className="font-medium">{formatDate(offer.validFrom)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Until:</span>
                        <span className="font-medium">{formatDate(offer.validUntil)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
                    onClick={() => {
                      toast({
                        title: "Offer Applied!",
                        description: `Discount code "${offer.discountCode}" is ready to use.`,
                      });
                    }}
                  >
                    Use This Offer
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* How to Use Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Gift className="h-5 w-5" />
              How to Use Offers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="font-medium text-foreground">Copy the discount code</div>
                <div className="text-sm text-muted-foreground">Click the copy button next to any offer code</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="font-medium text-foreground">Book a service</div>
                <div className="text-sm text-muted-foreground">Find a freelancer and proceed to booking</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="font-medium text-foreground">Apply the code</div>
                <div className="text-sm text-muted-foreground">Paste the code during checkout to get your discount</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <Navigation userRole="customer" />
    </div>
  );
}
