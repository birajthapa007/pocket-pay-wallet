import { ArrowLeft, Copy, QrCode, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ReceiveScreenProps {
  user: User;
  onBack: () => void;
}

const ReceiveScreen = ({ user, onBack }: ReceiveScreenProps) => {
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
    }
  };

  return (
    <div className="screen-container flex flex-col animate-fade-in min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Receive Money</h1>
      </div>

      {/* QR Code Section */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-card border border-border/50 rounded-3xl p-8 mb-8 shadow-lg">
          <div className="w-48 h-48 bg-foreground rounded-2xl flex items-center justify-center relative overflow-hidden">
            <QrCode className="w-36 h-36 text-background" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/10" />
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-3">Your username</p>
          <div className="flex items-center gap-3 justify-center">
            <span className="text-2xl font-bold text-foreground">@{user.username}</span>
            <button
              onClick={handleCopyUsername}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-all"
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
      <Button
        variant="secondary"
        size="full"
        onClick={handleShare}
        className="mb-4"
      >
        <Share2 className="w-5 h-5" />
        Share your profile
      </Button>
    </div>
  );
};

export default ReceiveScreen;
