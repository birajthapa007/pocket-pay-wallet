import { Transaction } from '@/types/wallet';
import TransactionItem from '@/components/wallet/TransactionItem';

interface HistoryScreenProps {
  transactions: Transaction[];
}

const HistoryScreen = ({ transactions }: HistoryScreenProps) => {
  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
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
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground">Your transaction history</p>
      </div>

      {/* Transaction List */}
      <div className="space-y-6">
        {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
          <div key={date}>
            <p className="text-sm text-muted-foreground font-medium mb-3">{date}</p>
            <div className="space-y-2">
              {dateTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
