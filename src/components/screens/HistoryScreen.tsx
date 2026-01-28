import { Transaction } from '@/types/wallet';
import TransactionRow from '@/components/wallet/TransactionRow';

interface HistoryScreenProps {
  transactions: Transaction[];
  onViewTransaction: (t: Transaction) => void;
}

const HistoryScreen = ({ transactions, onViewTransaction }: HistoryScreenProps) => {
  // Group by date
  const grouped = transactions.reduce((acc, t) => {
    const key = t.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="screen-container animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Activity</h1>

      <div className="space-y-6">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              {date}
            </p>
            <div className="space-y-0">
              {txs.map((t) => (
                <TransactionRow 
                  key={t.id} 
                  transaction={t} 
                  onClick={() => onViewTransaction(t)}
                />
              ))}
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No activity yet
          </p>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
