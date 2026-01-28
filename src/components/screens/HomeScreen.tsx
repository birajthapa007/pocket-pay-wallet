import { ArrowUpRight, ArrowDownLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletBalance, Transaction, User } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';
import TransactionItem from '@/components/wallet/TransactionItem';
import { useState } from 'react';

interface HomeScreenProps {
  balance: WalletBalance;
  transactions: Transaction[];
  user: User;
  hideBalance: boolean;
  onSend: () => void;
  onReceive: () => void;
  onViewHistory: () => void;
  onOpenProfile: () => void;
}

const HomeScreen = ({ 
  balance, 
  transactions, 
  user, 
  hideBalance: initialHideBalance,
  onSend, 
  onReceive, 
  onViewHistory,
  onOpenProfile 
}: HomeScreenProps) => {
  const [hideBalance, setHideBalance] = useState(initialHideBalance);
  const dollars = Math.floor(balance.available);
  const cents = Math.round((balance.available - dollars) * 100);

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back,</p>
          <p className="text-lg font-semibold">{user.name.split(' ')[0]}</p>
        </div>
        <button 
          onClick={onOpenProfile}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold shadow-glow-sm"
        >
          {getInitials(user.name)}
        </button>
      </div>

      {/* Balance Card */}
      <div className="wallet-card mb-6">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <button 
              onClick={() => setHideBalance(!hideBalance)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {hideBalance ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-xl text-muted-foreground">$</span>
            {hideBalance ? (
              <span className="balance-display">••••••</span>
            ) : (
              <>
                <span className="balance-display">{dollars.toLocaleString()}</span>
                <span className="balance-cents">.{cents.toString().padStart(2, '0')}</span>
              </>
            )}
          </div>
          
          {balance.pending > 0 && !hideBalance && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-soft text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              <span className="text-warning-foreground">{formatCurrency(balance.pending)} pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Button
          variant="send"
          size="full"
          onClick={onSend}
          className="flex items-center justify-center gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="font-semibold">Send</span>
        </Button>
        
        <Button
          variant="receive"
          size="full"
          onClick={onReceive}
          className="flex items-center justify-center gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold">Receive</span>
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
            transactions.map((transaction, i) => (
              <div 
                key={transaction.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <TransactionItem transaction={transaction} />
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Send or receive money to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
