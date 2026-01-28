import { ArrowLeft, Copy, QrCode, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currentUser } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

interface ReceiveScreenProps {
  onBack: () => void;
}

const ReceiveScreen = ({ onBack }: ReceiveScreenProps) => {
  const handleCopyUsername = () => {
    navigator.clipboard.writeText(`@${currentUser.username}`);
    toast({
      title: "Copied!",
      description: "Username copied to clipboard",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Send me money on Pocket Pay',
        text: `Send me money on Pocket Pay: @${currentUser.username}`,
        url: `https://pocketpay.app/${currentUser.username}`,
      });
    }
  };

  return (
    <div className="screen-container flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Receive Money</h1>
      </div>

      {/* QR Code Section */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-card border border-border rounded-3xl p-8 mb-8">
          <div className="w-48 h-48 bg-foreground rounded-2xl flex items-center justify-center">
            <QrCode className="w-36 h-36 text-background" />
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-2">Your username</p>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-2xl font-bold">@{currentUser.username}</span>
            <button
              onClick={handleCopyUsername}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <Copy className="w-5 h-5" />
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
