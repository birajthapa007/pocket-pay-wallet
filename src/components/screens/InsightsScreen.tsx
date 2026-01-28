import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { Transaction, WalletBalance } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';

interface InsightsScreenProps {
  transactions: Transaction[];
  balance: WalletBalance;
}

const InsightsScreen = ({ transactions, balance }: InsightsScreenProps) => {
  const now = new Date();
  const thisMonth = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const spent = thisMonth
    .filter((t) => t.type === 'send' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const received = thisMonth
    .filter((t) => t.type === 'receive' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const blocked = transactions
    .filter((t) => t.status === 'BLOCKED')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthName = now.toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="screen-container animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">Insights</h1>
      <p className="text-muted-foreground mb-8">{monthName}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card-subtle">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
            <TrendingDown className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Spent</p>
          <p className="text-2xl font-bold">{formatCurrency(spent)}</p>
        </div>

        <div className="card-subtle">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Received</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(received)}</p>
        </div>
      </div>

      {/* Protected */}
      {blocked > 0 && (
        <div className="card-subtle bg-primary-soft/30 border-primary/20 mb-8 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold mb-1">We protected you</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(blocked)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Blocked from suspicious activity
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Balance summary */}
      <div className="card-subtle">
        <p className="text-sm text-muted-foreground mb-2">Current balance</p>
        <p className="text-3xl font-bold">{formatCurrency(balance.available)}</p>
        {balance.pending > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            +{formatCurrency(balance.pending)} pending
          </p>
        )}
      </div>
    </div>
  );
};

export default InsightsScreen;
