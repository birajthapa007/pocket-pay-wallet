import React from 'react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  HandCoins,
  TrendingUp,
  TrendingDown,
  Calendar,
  MoreHorizontal,
  UserMinus,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, Transaction, ContactFinancials } from '@/types/wallet';
import { formatCurrency, formatRelativeTime, getContactFinancials } from '@/data/mockData';
import TransactionItem from '@/components/wallet/TransactionItem';
import { cn } from '@/lib/utils';

interface ContactProfileScreenProps {
  contact: User;
  transactions: Transaction[];
  onSend: () => void;
  onRequest: () => void;
  onBack: () => void;
}

const ContactProfileScreen = React.forwardRef<HTMLDivElement, ContactProfileScreenProps>(
  ({ contact, transactions, onSend, onRequest, onBack }, ref) => {
    const financials = getContactFinancials(contact.id, transactions);
    
    // Get transactions with this contact
    const contactTransactions = transactions.filter(t => 
      (t.recipient?.id === contact.id) || (t.sender?.id === contact.id)
    ).slice(0, 5);

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const getAvatarColor = (id: string) => {
      const colors = [
        'from-primary to-primary/70',
        'from-info to-info/70',
        'from-success to-success/70',
        'from-warning to-warning/70',
      ];
      const index = parseInt(id) % colors.length;
      return colors[index];
    };

    const netAmount = financials.totalReceived - financials.totalSent;

    return (
      <div ref={ref} className="screen-container animate-fade-in safe-top">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4",
            "bg-gradient-to-br shadow-lg",
            getAvatarColor(contact.id)
          )}>
            {getInitials(contact.name)}
          </div>
          <h1 className="text-2xl font-bold mb-1">{contact.name}</h1>
          <p className="text-muted-foreground">@{contact.username}</p>
          {contact.phone && (
            <p className="text-sm text-muted-foreground mt-1">{contact.phone}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Button
            variant="send"
            size="lg"
            onClick={onSend}
            className="flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="w-5 h-5" />
            Send
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onRequest}
            className="flex items-center justify-center gap-2 bg-info-soft border-info/20 hover:bg-info-soft/80 text-info-foreground"
          >
            <HandCoins className="w-5 h-5" />
            Request
          </Button>
        </div>

        {/* Financial Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Total Sent */}
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-destructive-soft flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-sm text-muted-foreground">You sent</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(financials.totalSent)}
              </p>
            </div>

            {/* Total Received */}
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">You received</span>
              </div>
              <p className="text-xl font-bold text-success">
                {formatCurrency(financials.totalReceived)}
              </p>
            </div>
          </div>

          {/* Net Balance */}
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Net Balance</p>
                <p className={cn(
                  "text-2xl font-bold",
                  netAmount >= 0 ? "text-success" : "text-destructive"
                )}>
                  {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                <p className="text-2xl font-bold">{financials.transactionCount}</p>
              </div>
            </div>
            {financials.lastTransaction && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Last activity: {formatRelativeTime(financials.lastTransaction)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions with this Contact */}
        {contactTransactions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
            <div className="space-y-2">
              {contactTransactions.map((transaction, i) => (
                <div 
                  key={transaction.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <TransactionItem transaction={transaction} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="menu-section">
          <button className="settings-item w-full text-muted-foreground active:scale-[0.99]">
            <UserMinus className="w-5 h-5" />
            <span className="flex-1 text-left">Remove from contacts</span>
          </button>
          <button className="settings-item w-full text-destructive active:scale-[0.99]">
            <Flag className="w-5 h-5" />
            <span className="flex-1 text-left">Report user</span>
          </button>
        </div>
      </div>
    );
  }
);

ContactProfileScreen.displayName = 'ContactProfileScreen';

export default ContactProfileScreen;
