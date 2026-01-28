import { TrendingUp, TrendingDown, Shield, Wallet } from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';

interface InsightsScreenProps {
  transactions: Transaction[];
}

const InsightsScreen = ({ transactions }: InsightsScreenProps) => {
  // Calculate insights from transactions
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

  const insights = [
    {
      icon: TrendingDown,
      label: 'Spent this month',
      value: formatCurrency(monthlySpent),
      color: 'text-foreground',
      bgColor: 'bg-secondary',
    },
    {
      icon: TrendingUp,
      label: 'Received this month',
      value: formatCurrency(monthlyReceived),
      color: 'text-success',
      bgColor: 'bg-success-soft',
    },
    {
      icon: Shield,
      label: 'We protected',
      value: formatCurrency(fraudBlocked),
      color: 'text-primary',
      bgColor: 'bg-primary-soft',
      subtitle: fraudBlocked > 0 ? 'Blocked suspicious activity' : 'No threats detected',
    },
    {
      icon: Wallet,
      label: 'Total transactions',
      value: monthlyTransactions.length.toString(),
      color: 'text-info',
      bgColor: 'bg-info-soft',
      subtitle: 'This month',
    },
  ];

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground">{monthName} summary</p>
      </div>

      {/* Insight Cards */}
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="insight-card">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${insight.bgColor} flex items-center justify-center`}>
                <insight.icon className={`w-6 h-6 ${insight.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{insight.label}</p>
                <p className={`text-2xl font-bold ${insight.color}`}>{insight.value}</p>
                {insight.subtitle && (
                  <p className="text-xs text-muted-foreground">{insight.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Message */}
      <div className="mt-8 p-5 bg-primary-soft rounded-2xl">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-1">
              Your money is protected
            </p>
            <p className="text-sm text-muted-foreground">
              Pocket Pay uses bank-level encryption and real-time fraud detection to keep your funds safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsScreen;
