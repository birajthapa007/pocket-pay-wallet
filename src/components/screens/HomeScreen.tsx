import { ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletBalance, Transaction } from '@/types/wallet';
import { formatCurrency, formatRelativeTime } from '@/data/mockData';
import TransactionItem from '@/components/wallet/TransactionItem';

interface HomeScreenProps {
  balance: WalletBalance;
  transactions: Transaction[];
  onSend: () => void;
  onReceive: () => void;
  onViewHistory: () => void;
}

const HomeScreen = ({ balance, transactions, onSend, onReceive, onViewHistory }: HomeScreenProps) => {
  const dollars = Math.floor(balance.available);
  const cents = Math.round((balance.available - dollars) * 100);

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Your Balance</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <span className="text-lg font-bold text-primary-foreground">A</span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="wallet-card mb-8 text-primary-foreground">
        <div className="relative z-10">
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-lg opacity-80">$</span>
            <span className="balance-display">{dollars.toLocaleString()}</span>
            <span className="balance-cents">.{cents.toString().padStart(2, '0')}</span>
          </div>
          
          {balance.pending > 0 && (
            <p className="text-sm opacity-70">
              +{formatCurrency(balance.pending)} pending
            </p>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute bottom-0 right-8 w-16 h-16 rounded-full bg-white/5" />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button
          variant="send"
          size="full"
          onClick={onSend}
          className="flex items-center justify-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold">Send</span>
        </Button>
        
        <Button
          variant="receive"
          size="full"
          onClick={onReceive}
          className="flex items-center justify-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-semibold">Receive</span>
        </Button>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button
            onClick={onViewHistory}
            className="flex items-center gap-1 text-sm text-primary font-medium"
          >
            See all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
