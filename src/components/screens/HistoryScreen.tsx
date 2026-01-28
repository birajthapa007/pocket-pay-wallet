import React from 'react';
import { Transaction } from '@/types/wallet';
import TransactionItem from '@/components/wallet/TransactionItem';
import { Search, Clock, HandCoins, ArrowUpRight, ArrowDownLeft, Building2 } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency, formatRelativeTime } from '@/data/mockData';

interface MoneyRequest {
  id: string;
  amount: number;
  note?: string;
  status: string;
  created_at: string;
  requester?: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  };
  requested_from?: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  };
}

interface HistoryScreenProps {
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
  incomingRequests?: MoneyRequest[];
  outgoingRequests?: MoneyRequest[];
}

type FilterType = 'all' | 'sent' | 'received' | 'requests' | 'deposits';

const HistoryScreen = React.forwardRef<HTMLDivElement, HistoryScreenProps>(
  ({ transactions, onTransactionClick, incomingRequests = [], outgoingRequests = [] }, ref) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    // Combine transactions and requests into a unified activity list
    const allActivities = React.useMemo(() => {
      const activities: Array<{
        type: 'transaction' | 'request_out' | 'request_in';
        data: Transaction | MoneyRequest;
        date: Date;
        id: string;
      }> = [];

      // Add transactions
      transactions.forEach(t => {
        activities.push({
          type: 'transaction',
          data: t,
          date: t.createdAt,
          id: `tx-${t.id}`,
        });
      });

      // Add outgoing requests (awaiting payment)
      outgoingRequests.forEach(r => {
        activities.push({
          type: 'request_out',
          data: r,
          date: new Date(r.created_at),
          id: `req-out-${r.id}`,
        });
      });

      // Add incoming requests (someone requested from me)
      incomingRequests.forEach(r => {
        activities.push({
          type: 'request_in',
          data: r,
          date: new Date(r.created_at),
          id: `req-in-${r.id}`,
        });
      });

      // Sort by date descending
      return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [transactions, incomingRequests, outgoingRequests]);

    // Filter activities
    const filteredActivities = allActivities.filter(activity => {
      const searchLower = searchQuery.toLowerCase();
      
      // Search matching
      let matchesSearch = false;
      if (activity.type === 'transaction') {
        const t = activity.data as Transaction;
        matchesSearch = 
          t.description.toLowerCase().includes(searchLower) ||
          t.recipient?.name?.toLowerCase().includes(searchLower) ||
          t.sender?.name?.toLowerCase().includes(searchLower);
      } else {
        const r = activity.data as MoneyRequest;
        matchesSearch = 
          (r.note?.toLowerCase().includes(searchLower) || false) ||
          r.requester?.name?.toLowerCase().includes(searchLower) ||
          r.requested_from?.name?.toLowerCase().includes(searchLower);
      }

      // Filter matching
      if (filter === 'all') return matchesSearch;
      if (filter === 'sent') {
        return matchesSearch && activity.type === 'transaction' && (activity.data as Transaction).type === 'send';
      }
      if (filter === 'received') {
        return matchesSearch && activity.type === 'transaction' && (activity.data as Transaction).type === 'receive';
      }
      if (filter === 'requests') {
        return matchesSearch && (activity.type === 'request_out' || activity.type === 'request_in');
      }
      if (filter === 'deposits') {
        return matchesSearch && activity.type === 'transaction' && 
          ((activity.data as Transaction).type === 'deposit' || (activity.data as Transaction).type === 'withdrawal');
      }
      return matchesSearch;
    });

    // Group by date
    const groupedActivities = filteredActivities.reduce((groups, activity) => {
      const date = activity.date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    }, {} as Record<string, typeof filteredActivities>);

    const renderRequestItem = (request: MoneyRequest, type: 'request_out' | 'request_in') => {
      const isOutgoing = type === 'request_out';
      const person = isOutgoing ? request.requested_from : request.requester;
      const statusColors = {
        pending: 'bg-info-soft text-info',
        accepted: 'bg-success-soft text-success',
        declined: 'bg-error-soft text-error',
        cancelled: 'bg-muted text-muted-foreground',
      };

      return (
        <div className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-xl hover:bg-secondary/30 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            {isOutgoing ? (
              <Clock className="w-5 h-5 text-primary" />
            ) : (
              <HandCoins className="w-5 h-5 text-warning" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground text-sm truncate">
                {isOutgoing 
                  ? `Requested from ${person?.name || 'someone'}`
                  : `${person?.name || 'Someone'} requested`
                }
              </p>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[request.status as keyof typeof statusColors] || statusColors.pending}`}>
                {request.status === 'pending' 
                  ? (isOutgoing ? 'Awaiting payment' : 'Action needed')
                  : request.status.charAt(0).toUpperCase() + request.status.slice(1)
                }
              </span>
              {request.note && (
                <span className="text-xs text-muted-foreground truncate">• {request.note}</span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`font-semibold text-sm ${isOutgoing ? 'text-success' : 'text-warning'}`}>
              {isOutgoing ? '+' : ''}{formatCurrency(request.amount)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatRelativeTime(new Date(request.created_at))}
            </p>
          </div>
        </div>
      );
    };

    const filters: { key: FilterType; label: string; icon?: React.ReactNode }[] = [
      { key: 'all', label: 'All' },
      { key: 'sent', label: 'Sent', icon: <ArrowUpRight className="w-3 h-3" /> },
      { key: 'received', label: 'Received', icon: <ArrowDownLeft className="w-3 h-3" /> },
      { key: 'requests', label: 'Requests', icon: <HandCoins className="w-3 h-3" /> },
      { key: 'deposits', label: 'Bank', icon: <Building2 className="w-3 h-3" /> },
    ];

    return (
      <div ref={ref} className="screen-container animate-fade-in safe-top">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Activity</h1>
          <p className="text-muted-foreground text-sm">Your transactions and requests</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activity"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-input pl-12"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
                filter === f.key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Activity List */}
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([date, dateActivities]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">{date}</p>
              <div className="space-y-2">
                {dateActivities.map((activity, i) => (
                  <div 
                    key={activity.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {activity.type === 'transaction' ? (
                      <TransactionItem 
                        transaction={activity.data as Transaction} 
                        onClick={() => onTransactionClick(activity.data as Transaction)}
                      />
                    ) : (
                      renderRequestItem(
                        activity.data as MoneyRequest, 
                        activity.type as 'request_out' | 'request_in'
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>No activity found</p>
              {searchQuery && <p className="text-sm mt-1">Try a different search</p>}
            </div>
          )}
        </div>
      </div>
    );
  }
);

HistoryScreen.displayName = 'HistoryScreen';

export default HistoryScreen;
