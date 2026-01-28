import React from 'react';
import { ArrowUpRight, ArrowDownLeft, HandCoins, ChevronRight, Eye, EyeOff, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletBalance, Transaction, User, Screen } from '@/types/wallet';
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
  onRequest: () => void;
  onViewHistory: () => void;
  onOpenProfile: () => void;
  onNavigate: (screen: Screen) => void;
  onTransactionClick: (transaction: Transaction) => void;
}

const HomeScreen = React.forwardRef<HTMLDivElement, HomeScreenProps>(({ 
  balance, 
  transactions, 
  user, 
  hideBalance: initialHideBalance,
  onSend, 
  onReceive, 
  onRequest,
  onViewHistory,
  onOpenProfile,
  onNavigate,
  onTransactionClick
}, ref) => {
  const [hideBalance, setHideBalance] = useState(initialHideBalance);
  const dollars = Math.floor(balance.available);
  const cents = Math.round((balance.available - dollars) * 100);

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <div ref={ref} className="screen-container animate-fade-in safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back,</p>
          <p className="text-lg font-semibold">{user.name.split(' ')[0]}</p>
        </div>
        <button 
          onClick={onOpenProfile}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold shadow-glow-sm active:scale-95 transition-transform"
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
              className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors active:scale-95"
            >
              {hideBalance ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          
          <div className="flex items-baseline gap-1 mb-4">
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
          
          {/* Card Quick Access */}
          <button 
            onClick={() => onNavigate('cards')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors active:scale-[0.98]"
          >
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">View Cards</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>
        </div>
      </div>

      {/* Action Buttons - 3 columns for mobile */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        <Button
          variant="send"
          size="lg"
          onClick={onSend}
          className="flex flex-col items-center justify-center gap-2 h-auto py-4"
        >
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">Send</span>
        </Button>
        
        <Button
          variant="receive"
          size="lg"
          onClick={onReceive}
          className="flex flex-col items-center justify-center gap-2 h-auto py-4"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-sm">Receive</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={onRequest}
          className="flex flex-col items-center justify-center gap-2 h-auto py-4 bg-info-soft border-info/20 hover:bg-info-soft/80 text-info-foreground"
        >
          <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
            <HandCoins className="w-5 h-5 text-info" />
          </div>
          <span className="font-semibold text-sm">Request</span>
        </Button>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button
            onClick={onViewHistory}
            className="flex items-center gap-1 text-sm text-primary font-medium active:opacity-70"
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
                <TransactionItem 
                  transaction={transaction} 
                  onClick={() => onTransactionClick(transaction)}
                />
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
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;
