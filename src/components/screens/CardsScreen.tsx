import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  Plus, 
  Snowflake, 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  Smartphone,
  Truck,
  Shield,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Screen } from '@/types/wallet';
import { useCards, useCardDetail, useFreezeCard, useUnfreezeCard, useCreateCard } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CardsScreenProps {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
}

const formatCardNumber = (cardNumber: string, showFull: boolean = false): string => {
  if (showFull) return cardNumber;
  return `•••• •••• •••• ${cardNumber.slice(-4)}`;
};

const CardsScreen = React.forwardRef<HTMLDivElement, CardsScreenProps>(
  ({ onBack, onNavigate }, ref) => {
    const { data: cards = [], isLoading } = useCards();
    const [showCardDetails, setShowCardDetails] = useState<Record<string, boolean>>({});
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    
    const { data: cardDetails } = useCardDetail(selectedCardId);
    const freezeCard = useFreezeCard();
    const unfreezeCard = useUnfreezeCard();
    const createCard = useCreateCard();

    const toggleCardDetails = (cardId: string) => {
      if (!showCardDetails[cardId]) {
        setSelectedCardId(cardId);
      }
      setShowCardDetails(prev => ({
        ...prev,
        [cardId]: !prev[cardId]
      }));
    };

    const toggleFreezeCard = (cardId: string) => {
      const card = cards.find(c => c.id === cardId);
      if (card?.isFrozen) {
        unfreezeCard.mutate(cardId);
      } else {
        freezeCard.mutate(cardId);
      }
    };

    const handleCreateCard = () => {
      createCard.mutate();
    };

    const copyToClipboard = (text: string, field: string) => {
      navigator.clipboard.writeText(text.replace(/\s/g, ''));
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
    };

    const virtualCards = cards.filter(c => c.type === 'virtual');
    const physicalCards = cards.filter(c => c.type === 'physical');

    if (isLoading) {
      return (
        <div ref={ref} className="screen-container flex items-center justify-center min-h-screen safe-top">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading cards...</p>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className="screen-container animate-fade-in safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Cards</h1>
            <p className="text-muted-foreground text-sm">Manage your payment cards</p>
          </div>
        </div>

        {/* Virtual Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Virtual Cards</h2>
            </div>
            <button 
              onClick={handleCreateCard}
              disabled={createCard.isPending}
              className="flex items-center gap-1 text-sm text-primary font-medium active:opacity-70 disabled:opacity-50"
            >
              {createCard.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </button>
          </div>

          {virtualCards.length > 0 ? (
            <div className="space-y-4">
              {virtualCards.map(card => {
                const details = showCardDetails[card.id] && cardDetails?.id === card.id ? cardDetails : card;
                
                return (
                  <div 
                    key={card.id} 
                    className={cn(
                      "card-display rounded-2xl p-5 relative overflow-hidden",
                      card.isFrozen && "opacity-60"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10" />
                    <div className="relative z-10">
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-6 h-6 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground">Virtual Card</span>
                        </div>
                        {card.isFrozen && (
                          <span className="px-2 py-1 rounded-full bg-info-soft text-info text-xs font-medium flex items-center gap-1">
                            <Snowflake className="w-3 h-3" />
                            Frozen
                          </span>
                        )}
                      </div>

                      {/* Card Number */}
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-1">Card Number</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-mono font-semibold tracking-wider">
                            {formatCardNumber(details.cardNumber, showCardDetails[card.id])}
                          </p>
                          <button 
                            onClick={() => copyToClipboard(details.cardNumber, 'Card number')}
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            {copiedField === 'Card number' ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Card Details Row */}
                      <div className="flex gap-6 mb-6">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Expiry</p>
                          <p className="font-mono font-semibold">{card.expiryDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">CVV</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-semibold">
                              {showCardDetails[card.id] ? details.cvv : '•••'}
                            </p>
                            {showCardDetails[card.id] && (
                              <button 
                                onClick={() => copyToClipboard(details.cvv, 'CVV')}
                                className="p-1 rounded hover:bg-white/10 transition-colors"
                              >
                                {copiedField === 'CVV' ? (
                                  <Check className="w-3 h-3 text-success" />
                                ) : (
                                  <Copy className="w-3 h-3 text-muted-foreground" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleCardDetails(card.id)}
                          className="flex-1"
                        >
                          {showCardDetails[card.id] ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Show
                            </>
                          )}
                        </Button>
                        <Button
                          variant={card.isFrozen ? "default" : "secondary"}
                          size="sm"
                          onClick={() => toggleFreezeCard(card.id)}
                          disabled={freezeCard.isPending || unfreezeCard.isPending}
                          className="flex-1"
                        >
                          {(freezeCard.isPending || unfreezeCard.isPending) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Snowflake className="w-4 h-4" />
                              {card.isFrozen ? 'Unfreeze' : 'Freeze'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-2xl">
              <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No virtual cards yet</p>
              <p className="text-sm mt-1">Create one for secure online payments</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateCard}
                disabled={createCard.isPending}
                className="mt-4"
              >
                {createCard.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Virtual Card
              </Button>
            </div>
          )}
        </div>

        {/* Physical Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Physical Cards</h2>
            </div>
            <button className="flex items-center gap-1 text-sm text-primary font-medium active:opacity-70">
              <Plus className="w-4 h-4" />
              Order
            </button>
          </div>

          {physicalCards.length > 0 ? (
            <div className="space-y-4">
              {physicalCards.map(card => (
                <div 
                  key={card.id} 
                  className={cn(
                    "bg-card border border-border/50 rounded-2xl p-5",
                    card.isFrozen && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-10 rounded-lg bg-gradient-to-br from-foreground/90 to-foreground/70 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-background" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Physical Card</p>
                      <p className="text-sm text-muted-foreground">•••• {card.lastFour}</p>
                    </div>
                    {card.isFrozen ? (
                      <span className="px-2 py-1 rounded-full bg-info-soft text-info text-xs font-medium">
                        Frozen
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-success-soft text-success text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={card.isFrozen ? "default" : "secondary"}
                      size="sm"
                      onClick={() => toggleFreezeCard(card.id)}
                      disabled={freezeCard.isPending || unfreezeCard.isPending}
                      className="flex-1"
                    >
                      {(freezeCard.isPending || unfreezeCard.isPending) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Snowflake className="w-4 h-4" />
                          {card.isFrozen ? 'Unfreeze' : 'Freeze'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      <Shield className="w-4 h-4" />
                      Settings
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-2xl">
              <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No physical card yet</p>
              <p className="text-sm mt-1">Order one for in-store payments</p>
            </div>
          )}
        </div>

        {/* Card Benefits */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="font-semibold mb-3">Card Benefits</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center">
                <Shield className="w-4 h-4 text-success" />
              </div>
              <span className="text-muted-foreground">Instant fraud protection on all purchases</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center">
                <Snowflake className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Freeze and unfreeze cards instantly</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CardsScreen.displayName = 'CardsScreen';

export default CardsScreen;
