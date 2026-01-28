import { ArrowUpRight, ArrowDownLeft, Hand, ChevronRight } from 'lucide-react';
import { WalletBalance, Transaction, User } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';
import TransactionRow from '@/components/wallet/TransactionRow';

interface HomeScreenProps {
  balance: WalletBalance;
  transactions: Transaction[];
  user: User;
  onSend: () => void;
  onReceive: () => void;
  onRequest: () => void;
  onViewHistory: () => void;
  onViewTransaction: (t: Transaction) => void;
}

const HomeScreen = ({ 
  balance, 
  transactions, 
  user,
  onSend, 
  onReceive,
  onRequest,
  onViewHistory,
  onViewTransaction,
}: HomeScreenProps) => {
  const dollars = Math.floor(balance.available);
  const cents = Math.round((balance.available - dollars) * 100);

  return (
    <div className="screen-container animate-fade-in">
      {/* Balance Hero */}
      <div className="balance-hero">
        <p className="text-muted-foreground text-sm mb-2">Your balance</p>
        <div className="flex items-baseline justify-center gap-0.5">
          <span className="text-2xl font-bold text-muted-foreground">$</span>
          <span className="balance-amount">{dollars.toLocaleString()}</span>
          <span className="balance-cents">.{cents.toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Action Buttons - Cash App style circles */}
      <div className="flex justify-center gap-8 mb-10">
        <div className="action-circle">
          <button onClick={onSend} className="action-circle-btn primary">
            <ArrowUpRight className="w-7 h-7 text-primary-foreground" />
          </button>
          <span className="action-circle-label">Send</span>
        </div>
        
        <div className="action-circle">
          <button onClick={onReceive} className="action-circle-btn">
            <ArrowDownLeft className="w-7 h-7" />
          </button>
          <span className="action-circle-label">Receive</span>
        </div>
        
        <div className="action-circle">
          <button onClick={onRequest} className="action-circle-btn">
            <Hand className="w-7 h-7" />
          </button>
          <span className="action-circle-label">Request</span>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Activity</h2>
          <button 
            onClick={onViewHistory}
            className="flex items-center gap-1 text-sm text-primary font-medium"
          >
            See all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-0">
          {transactions.map((t, i) => (
            <div 
              key={t.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <TransactionRow 
                transaction={t} 
                onClick={() => onViewTransaction(t)}
              />
            </div>
          ))}
          
          {transactions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No activity yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
