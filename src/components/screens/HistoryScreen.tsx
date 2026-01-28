import { Transaction } from '@/types/wallet';
import TransactionItem from '@/components/wallet/TransactionItem';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface HistoryScreenProps {
  transactions: Transaction[];
}

const HistoryScreen = ({ transactions }: HistoryScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      t.description.toLowerCase().includes(searchLower) ||
      t.recipient?.name.toLowerCase().includes(searchLower) ||
      t.sender?.name.toLowerCase().includes(searchLower)
    );
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
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Activity</h1>
        <p className="text-muted-foreground text-sm">Your transaction history</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mobile-input pl-12"
        />
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
                  <TransactionItem transaction={transaction} />
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
};

export default HistoryScreen;
