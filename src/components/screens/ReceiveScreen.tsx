import { ArrowLeft, Copy, Share2, Check, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { useState } from 'react';

interface ReceiveScreenProps {
  user: User;
  onBack: () => void;
}

const ReceiveScreen = ({ user, onBack }: ReceiveScreenProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`$${user.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Pay me on Pocket Pay',
        text: `Send me money: $${user.username}`,
      });
    }
  };

  return (
    <div className="screen-container flex flex-col min-h-screen animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Receive</h1>
      </div>

      {/* QR Code */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="card-subtle p-8 mb-8">
          <div className="w-48 h-48 bg-foreground rounded-xl flex items-center justify-center">
            <QrCode className="w-32 h-32 text-background" />
          </div>
        </div>

        <p className="text-muted-foreground mb-2">Your username</p>
        
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">${user.username}</span>
          <button
            onClick={handleCopy}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            {copied ? (
              <Check className="w-5 h-5 text-primary" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Share */}
      <Button variant="secondary" size="full" onClick={handleShare}>
        <Share2 className="w-5 h-5" />
        Share
      </Button>
    </div>
  );
};

export default ReceiveScreen;
