import React from 'react';
import { HandCoins, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface RequestSuccessScreenProps {
  requestFrom: User;
  amount: number;
  note?: string;
  onDone: () => void;
}

const RequestSuccessScreen = React.forwardRef<HTMLDivElement, RequestSuccessScreenProps>(
  ({ requestFrom, amount, note, onDone }, ref) => {
    const [copied, setCopied] = useState(false);

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const requestLink = `pocketpay.app/request/${Date.now()}`;

    const handleCopyLink = () => {
      navigator.clipboard.writeText(`https://${requestLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share this link with anyone to request payment",
      });
    };

    const handleShare = () => {
      if (navigator.share) {
        navigator.share({
          title: 'Payment Request',
          text: `${requestFrom.name}, I'm requesting ${formatCurrency(amount)} via Pocket Pay${note ? ` for: ${note}` : ''}`,
          url: `https://${requestLink}`,
        });
      } else {
        handleCopyLink();
      }
    };

    return (
      <div ref={ref} className="screen-container flex flex-col items-center justify-center animate-fade-in safe-top min-h-screen text-center">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full bg-info-soft flex items-center justify-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-info flex items-center justify-center">
              <HandCoins className="w-10 h-10 text-info-foreground" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-info to-info/70 flex items-center justify-center text-white text-sm font-bold animate-scale-in shadow-lg" style={{ animationDelay: '200ms' }}>
            {getInitials(requestFrom.name)}
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold mb-2">Request Sent!</h1>
        <p className="text-muted-foreground mb-6">
          You've requested payment from {requestFrom.name}
        </p>

        {/* Amount */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6 w-full max-w-sm">
          <p className="text-sm text-muted-foreground mb-1">Amount Requested</p>
          <p className="text-3xl font-bold text-info">{formatCurrency(amount)}</p>
          {note && (
            <p className="text-sm text-muted-foreground mt-2">"{note}"</p>
          )}
        </div>

        {/* Share Options */}
        <div className="w-full max-w-sm mb-8">
          <p className="text-sm text-muted-foreground mb-3">Share request link</p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary rounded-xl hover:bg-muted transition-colors active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy Link</span>
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-info-soft text-info rounded-xl hover:bg-info-soft/80 transition-colors active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>

        {/* Done Button */}
        <Button
          variant="default"
          size="full"
          onClick={onDone}
          className="max-w-sm"
        >
          Done
        </Button>
      </div>
    );
  }
);

RequestSuccessScreen.displayName = 'RequestSuccessScreen';

export default RequestSuccessScreen;
