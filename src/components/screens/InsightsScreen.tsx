import { TrendingUp, TrendingDown, Shield, Activity, Sparkles } from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';

interface InsightsScreenProps {
  transactions: Transaction[];
}

const InsightsScreen = ({ transactions }: InsightsScreenProps) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const date = new Date(t.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlySpent = monthlyTransactions
    .filter((t) => t.type === 'send' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyReceived = monthlyTransactions
    .filter((t) => t.type === 'receive' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const blockedTransactions = transactions.filter((t) => t.status === 'blocked');
  const fraudBlocked = blockedTransactions.reduce((sum, t) => sum + t.amount, 0);

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  const stats = [
    {
      icon: TrendingDown,
      label: 'Spent',
      value: formatCurrency(monthlySpent),
      color: 'text-foreground',
      bgColor: 'bg-secondary',
      iconColor: 'text-muted-foreground',
    },
    {
      icon: TrendingUp,
      label: 'Received',
      value: formatCurrency(monthlyReceived),
      color: 'text-success',
      bgColor: 'bg-success-soft',
      iconColor: 'text-success',
    },
  ];

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Insights</h1>
        <p className="text-muted-foreground text-sm">{monthName} summary</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="insight-card animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Protection Card */}
      <div 
        className="bg-gradient-to-br from-primary-soft to-primary/5 rounded-2xl p-5 border border-primary/20 mb-6 animate-fade-in"
        style={{ animationDelay: '100ms' }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground mb-1">Smart Protection</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(fraudBlocked)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {fraudBlocked > 0 ? 'Blocked from suspicious activity' : 'No threats detected'}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div 
        className="insight-card animate-fade-in"
        style={{ animationDelay: '150ms' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info-soft flex items-center justify-center">
            <Activity className="w-6 h-6 text-info" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Total transactions</p>
            <p className="text-2xl font-bold text-foreground">{monthlyTransactions.length}</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
        </div>
      </div>

      {/* Security Footer */}
      <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm">Powered by AI fraud detection</span>
      </div>
    </div>
  );
};

export default InsightsScreen;
