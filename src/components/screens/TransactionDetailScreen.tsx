import React from 'react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building,
  Check, 
  Clock, 
  ShieldAlert, 
  ShieldCheck,
  Copy,
  Share2,
  HandCoins,
  ChevronRight
} from 'lucide-react';
import { Transaction, Screen } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TransactionDetailScreenProps {
  transaction: Transaction;
  onBack: () => void;
  onViewProfile: () => void;
  onNavigate: (screen: Screen) => void;
}

const TransactionDetailScreen = React.forwardRef<HTMLDivElement, TransactionDetailScreenProps>(
  ({ transaction, onBack, onViewProfile, onNavigate }, ref) => {
    const { type, amount, status, description, recipient, sender, createdAt, id, isRisky } = transaction;

    const getStatusConfig = () => {
      switch (status) {
        case 'completed':
          return {
            icon: Check,
            label: 'Completed',
            color: 'text-success',
            bgColor: 'bg-success-soft',
            borderColor: 'border-success/20',
            description: 'Completed instantly',
            microcopy: 'Protected by Pocket Pay security',
          };
        case 'pending':
          return {
            icon: Clock,
            label: 'Processing',
            color: 'text-warning',
            bgColor: 'bg-warning-soft',
            borderColor: 'border-warning/20',
            description: 'Being verified for your safety',
            microcopy: 'We double-checked this transfer',
          };
        case 'blocked':
          return {
            icon: ShieldAlert,
            label: 'Blocked',
            color: 'text-destructive',
            bgColor: 'bg-destructive-soft',
            borderColor: 'border-destructive/20',
            description: 'Stopped to protect your account',
            microcopy: 'This action helped keep your account safe',
          };
        default:
          return {
            icon: Check,
            label: 'Unknown',
            color: 'text-muted-foreground',
            bgColor: 'bg-secondary',
            borderColor: 'border-border',
            description: '',
            microcopy: '',
          };
      }
    };

    const getTypeConfig = () => {
      switch (type) {
        case 'send':
          return { icon: ArrowUpRight, label: 'Sent', color: 'text-foreground' };
        case 'receive':
          return { icon: ArrowDownLeft, label: 'Received', color: 'text-success' };
        case 'deposit':
          return { icon: Building, label: 'Deposit', color: 'text-primary' };
        case 'request':
          return { icon: HandCoins, label: 'Requested', color: 'text-info' };
        default:
          return { icon: ArrowUpRight, label: 'Transaction', color: 'text-foreground' };
      }
    };

    const statusConfig = getStatusConfig();
    const typeConfig = getTypeConfig();
    const StatusIcon = statusConfig.icon;
    const TypeIcon = typeConfig.icon;

    const person = type === 'send' ? recipient : sender;
    const referenceId = `PP-${id.toUpperCase()}-${createdAt.getTime().toString(36).toUpperCase()}`;

    const handleCopyRef = () => {
      navigator.clipboard.writeText(referenceId);
      toast({
        title: "Copied!",
        description: "Reference ID copied to clipboard",
      });
    };

    const handleShare = () => {
      if (navigator.share) {
        navigator.share({
          title: `${typeConfig.label} ${formatCurrency(amount)}`,
          text: `Transaction ${referenceId} - ${formatCurrency(amount)} ${type === 'send' ? 'to' : 'from'} ${person?.name || 'Unknown'}`,
        });
      } else {
        handleCopyRef();
      }
    };

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const formattedDate = createdAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = createdAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

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
          <h1 className="text-xl font-bold">Transaction Details</h1>
        </div>

        {/* Status Card */}
        <div className={cn(
          "rounded-2xl p-5 mb-6 border",
          statusConfig.bgColor,
          statusConfig.borderColor
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              status === 'completed' ? 'bg-success' : status === 'blocked' ? 'bg-destructive' : 'bg-warning'
            )}>
              <StatusIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className={cn("text-lg font-bold", statusConfig.color)}>
                {statusConfig.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {statusConfig.description}
              </p>
            </div>
          </div>

          {/* Security Microcopy */}
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {statusConfig.microcopy}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="text-center py-6 mb-6">
          <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
            <TypeIcon className="w-4 h-4" />
            {typeConfig.label}
          </p>
          <p className={cn(
            "text-4xl font-bold",
            status === 'blocked' ? 'text-destructive line-through' : typeConfig.color
          )}>
            {type === 'receive' ? '+' : '-'}{formatCurrency(amount)}
          </p>
        </div>

        {/* Person Card */}
        {person && person.id !== 'unknown' && (
          <button 
            onClick={onViewProfile}
            className="w-full bg-card border border-border/50 rounded-2xl p-4 mb-4 flex items-center gap-4 active:scale-[0.99] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold">
              {getInitials(person.name)}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-foreground truncate">{person.name}</p>
              <p className="text-sm text-muted-foreground">@{person.username}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        {/* Blocked Warning */}
        {status === 'blocked' && (
          <div className="bg-destructive-soft border border-destructive/20 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Transfer blocked for your protection
                </p>
                <p className="text-sm text-muted-foreground">
                  Our security system detected unusual activity and stopped this transfer to keep your money safe.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden mb-6">
          <div className="p-4 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="font-medium text-foreground">{description}</p>
          </div>
          <div className="p-4 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
            <p className="font-medium text-foreground">{formattedDate}</p>
            <p className="text-sm text-muted-foreground">{formattedTime}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Reference ID</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-foreground">{referenceId}</p>
              <button 
                onClick={handleCopyRef}
                className="p-1 rounded hover:bg-secondary transition-colors"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleShare}
            className="flex-1"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          {status === 'blocked' && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => onNavigate('help')}
            >
              Get Help
            </Button>
          )}
        </div>
      </div>
    );
  }
);

TransactionDetailScreen.displayName = 'TransactionDetailScreen';

export default TransactionDetailScreen;
