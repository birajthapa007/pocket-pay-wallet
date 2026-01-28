import React, { useState } from 'react';
import { ArrowLeft, Copy, QrCode, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { toast } from '@/hooks/use-toast';

interface ReceiveScreenProps {
  user: User;
  onBack: () => void;
}

const ReceiveScreen = React.forwardRef<HTMLDivElement, ReceiveScreenProps>(
  ({ user, onBack }, ref) => {
    const [copied, setCopied] = useState(false);

    const handleCopyUsername = () => {
      navigator.clipboard.writeText(`@${user.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Username copied to clipboard",
      });
    };

    const handleShare = () => {
      if (navigator.share) {
        navigator.share({
          title: 'Send me money on Pocket Pay',
          text: `Send me money on Pocket Pay: @${user.username}`,
          url: `https://pocketpay.app/${user.username}`,
        });
      } else {
        handleCopyUsername();
      }
    };

    return (
      <div ref={ref} className="screen-container flex flex-col animate-fade-in min-h-screen safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Receive Money</h1>
        </div>

        {/* QR Code Section */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 mb-8 shadow-lg">
            <div className="w-40 h-40 sm:w-48 sm:h-48 bg-foreground rounded-2xl flex items-center justify-center relative overflow-hidden">
              <QrCode className="w-28 h-28 sm:w-36 sm:h-36 text-background" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/10" />
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-3">Your username</p>
            <div className="flex items-center gap-3 justify-center">
              <span className="text-xl sm:text-2xl font-bold text-foreground">@{user.username}</span>
              <button
                onClick={handleCopyUsername}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-all active:scale-95"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <div className="safe-bottom pb-4">
          <Button
            variant="secondary"
            size="full"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
            Share your profile
          </Button>
        </div>
      </div>
    );
  }
);

ReceiveScreen.displayName = 'ReceiveScreen';

export default ReceiveScreen;
