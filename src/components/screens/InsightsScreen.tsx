import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Activity, 
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Users,
  Target,
  Zap,
  PiggyBank,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { formatCurrency, contacts } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface InsightsScreenProps {
  transactions: Transaction[];
}

const InsightsScreen = React.forwardRef<HTMLDivElement, InsightsScreenProps>(
  ({ transactions }, ref) => {
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter transactions based on period
    const getFilteredTransactions = () => {
      return transactions.filter((t) => {
        const date = new Date(t.createdAt);
        if (selectedPeriod === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        } else if (selectedPeriod === 'month') {
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        } else {
          return date.getFullYear() === currentYear;
        }
      });
    };

    const filteredTransactions = getFilteredTransactions();

    const totalSpent = filteredTransactions
      .filter((t) => t.type === 'send' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalReceived = filteredTransactions
      .filter((t) => t.type === 'receive' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = totalReceived - totalSpent;
    const blockedAmount = transactions.filter((t) => t.status === 'blocked')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate spending categories (simulated)
    const spendingCategories = [
      { name: 'Transfers', amount: totalSpent * 0.45, color: 'bg-primary', percent: 45 },
      { name: 'Bills', amount: totalSpent * 0.30, color: 'bg-info', percent: 30 },
      { name: 'Shopping', amount: totalSpent * 0.15, color: 'bg-warning', percent: 15 },
      { name: 'Other', amount: totalSpent * 0.10, color: 'bg-muted-foreground', percent: 10 },
    ];

    // Weekly spending data (simulated for chart)
    const weeklyData = [
      { day: 'Mon', amount: 120, height: 40 },
      { day: 'Tue', amount: 85, height: 28 },
      { day: 'Wed', amount: 200, height: 67 },
      { day: 'Thu', amount: 45, height: 15 },
      { day: 'Fri', amount: 180, height: 60 },
      { day: 'Sat', amount: 250, height: 83 },
      { day: 'Sun', amount: 90, height: 30 },
    ];

    // Top contacts by transaction volume
    const topContacts = contacts.slice(0, 3).map((c, i) => ({
      ...c,
      amount: [325, 250, 175][i],
      transactions: [5, 4, 3][i],
    }));

    const periodLabel = selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Year';
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    return (
      <div ref={ref} className="screen-container animate-fade-in safe-top pb-8 overflow-x-hidden">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold mb-1">Insights</h1>
          <p className="text-muted-foreground text-sm">{monthName} {currentYear}</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6 p-1 bg-secondary/50 rounded-xl">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98]",
                selectedPeriod === period 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground"
              )}
            >
              {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>

        {/* Cash Flow Overview */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Cash Flow</h2>
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-success-soft flex items-center justify-center">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-success" />
                </div>
                <span className="text-xs text-muted-foreground">Money In</span>
              </div>
              <p className="text-xl font-bold text-success">{formatCurrency(totalReceived)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Money Out</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalSpent)}</p>
            </div>
          </div>

          {/* Net Flow */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-xl",
            netFlow >= 0 ? "bg-success-soft" : "bg-destructive-soft"
          )}>
            <span className="text-sm font-medium">Net Flow</span>
            <span className={cn(
              "text-lg font-bold",
              netFlow >= 0 ? "text-success" : "text-destructive"
            )}>
              {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
            </span>
          </div>
        </div>

        {/* Weekly Spending Chart */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Spending Activity</h2>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          
          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-28 mb-3">
            {weeklyData.map((day, i) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className={cn(
                    "w-full rounded-t-lg transition-all",
                    i === 5 ? "bg-primary" : "bg-secondary"
                  )}
                  style={{ height: `${day.height}%`, minHeight: '8px' }}
                />
                <span className="text-[10px] text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Avg. {formatCurrency(138.57)}/day</span>
            <span className="text-primary font-medium">Sat highest</span>
          </div>
        </div>

        {/* Spending Categories */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Where you spent</h2>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          
          {/* Progress Bars */}
          <div className="space-y-3">
            {spendingCategories.map((cat, i) => (
              <div key={cat.name} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground">{cat.name}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(cat.amount)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500", cat.color)}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total Transactions */}
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl bg-info-soft flex items-center justify-center mb-3">
              <Activity className="w-4.5 h-4.5 text-info" />
            </div>
            <p className="text-2xl font-bold text-foreground">{filteredTransactions.length}</p>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </div>

          {/* Savings Rate (simulated) */}
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl bg-success-soft flex items-center justify-center mb-3">
              <PiggyBank className="w-4.5 h-4.5 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">24%</p>
            <p className="text-xs text-muted-foreground">Savings Rate</p>
          </div>

          {/* Goal Progress */}
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl bg-warning-soft flex items-center justify-center mb-3">
              <Target className="w-4.5 h-4.5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">68%</p>
            <p className="text-xs text-muted-foreground">Monthly Goal</p>
          </div>

          {/* Streak */}
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center mb-3">
              <Zap className="w-4.5 h-4.5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>

        {/* Top Contacts */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Top People</h2>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          
          <div className="space-y-3">
            {topContacts.map((contact, i) => (
              <div key={contact.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {getInitials(contact.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.transactions} transactions</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(contact.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Protection */}
        <div className="bg-gradient-to-br from-primary-soft to-primary/5 rounded-2xl p-4 border border-primary/20 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground mb-1 text-sm">Smart Protection</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(blockedAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {blockedAmount > 0 ? 'Blocked from suspicious activity' : 'No threats detected this period'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Footer */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground pt-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs">Insights powered by AI</span>
        </div>
      </div>
    );
  }
);

InsightsScreen.displayName = 'InsightsScreen';

export default InsightsScreen;
