import React from 'react';
import { Transaction } from '@/types/wallet';
import TransactionItem from '@/components/wallet/TransactionItem';
import { Search, Filter } from 'lucide-react';
import { useState } from 'react';

interface HistoryScreenProps {
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
}

const HistoryScreen = React.forwardRef<HTMLDivElement, HistoryScreenProps>(
  ({ transactions, onTransactionClick }, ref) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

    const filteredTransactions = transactions.filter((t) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        t.description.toLowerCase().includes(searchLower) ||
        t.recipient?.name.toLowerCase().includes(searchLower) ||
        t.sender?.name.toLowerCase().includes(searchLower);
      
      if (filter === 'all') return matchesSearch;
      if (filter === 'sent') return matchesSearch && t.type === 'send';
      if (filter === 'received') return matchesSearch && t.type === 'receive';
      return matchesSearch;
    });

    // Group transactions by date
    const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
      const date = transaction.createdAt.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);

    return (
      <div ref={ref} className="screen-container animate-fade-in safe-top">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Activity</h1>
          <p className="text-muted-foreground text-sm">Your transaction history</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-input pl-12"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {(['all', 'sent', 'received'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
                filter === f 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f === 'sent' ? 'Sent' : 'Received'}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">{date}</p>
              <div className="space-y-2">
                {dateTransactions.map((transaction, i) => (
                  <div 
                    key={transaction.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <TransactionItem 
                      transaction={transaction} 
                      onClick={() => onTransactionClick(transaction)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>No transactions found</p>
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
