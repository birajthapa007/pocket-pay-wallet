import { User, Transaction, WalletBalance, InsightData, Card, MoneyRequest, ContactFinancials } from '@/types/wallet';

export const currentUser: User = {
  id: '1',
  name: 'Alex Johnson',
  username: 'alexj',
  phone: '+1 (555) 123-4567',
  email: 'alex@email.com',
};

export const contacts: User[] = [
  { id: '2', name: 'Sarah Miller', username: 'sarahm', phone: '+1 (555) 234-5678' },
  { id: '3', name: 'Mike Chen', username: 'mikec', phone: '+1 (555) 345-6789' },
  { id: '4', name: 'Emily Davis', username: 'emilyd', phone: '+1 (555) 456-7890' },
  { id: '5', name: 'James Wilson', username: 'jamesw', phone: '+1 (555) 567-8901' },
  { id: '6', name: 'Lisa Brown', username: 'lisab', phone: '+1 (555) 678-9012' },
];

// Pocket Pay processes all transactions instantly - no pending!
export const walletBalance: WalletBalance = {
  available: 2997.52,
  pending: 0,
  total: 2997.52,
};

// All transactions are completed instantly - Pocket Pay doesn't delay anything
export const transactions: Transaction[] = [
  {
    id: 't1',
    type: 'receive',
    amount: 250.00,
    status: 'completed',
    description: 'Payment from Sarah',
    sender: contacts[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: 't2',
    type: 'send',
    amount: 45.00,
    status: 'completed',
    description: 'Dinner split',
    recipient: contacts[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
  },
  {
    id: 't3',
    type: 'send',
    amount: 150.00,
    status: 'completed', // Changed from pending - Pocket Pay is instant!
    description: 'Rent payment',
    recipient: contacts[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
  {
    id: 't4',
    type: 'receive',
    amount: 85.50,
    status: 'completed',
    description: 'Refund',
    sender: contacts[3],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: 't5',
    type: 'send',
    amount: 500.00,
    status: 'blocked',
    description: 'Suspicious transfer blocked',
    recipient: { id: 'unknown', name: 'Unknown', username: 'unknown' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    isRisky: true,
  },
  {
    id: 't6',
    type: 'deposit',
    amount: 1000.00,
    status: 'completed',
    description: 'Bank transfer',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
  },
  {
    id: 't7',
    type: 'send',
    amount: 32.99,
    status: 'completed',
    description: 'Coffee subscription',
    recipient: contacts[4],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
  },
  {
    id: 't8',
    type: 'receive',
    amount: 75.00,
    status: 'completed',
    description: 'Birthday gift',
    sender: contacts[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120), // 5 days ago
  },
];

export const cards: Card[] = [
  {
    id: 'card1',
    type: 'virtual',
    lastFour: '4829',
    cardNumber: '4532 8901 2345 4829',
    expiryDate: '12/28',
    cvv: '847',
    cardholderName: 'ALEX JOHNSON',
    isActive: true,
    isFrozen: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: 'card2',
    type: 'physical',
    lastFour: '7153',
    cardNumber: '4532 8901 2345 7153',
    expiryDate: '09/27',
    cvv: '291',
    cardholderName: 'ALEX JOHNSON',
    isActive: true,
    isFrozen: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
  },
];

export const moneyRequests: MoneyRequest[] = [
  {
    id: 'req1',
    amount: 50.00,
    requester: currentUser,
    requestedFrom: contacts[0],
    note: 'For the concert tickets',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
];

export const insightData: InsightData = {
  monthlySpend: 1842.50,
  monthlyReceived: 3250.00,
  fraudBlocked: 500.00,
  transactionCount: 47,
};

// Calculate financials between current user and a contact
export const getContactFinancials = (contactId: string, allTransactions: Transaction[]): ContactFinancials => {
  const contactTransactions = allTransactions.filter(t => 
    (t.recipient?.id === contactId) || (t.sender?.id === contactId)
  );
  
  const totalSent = contactTransactions
    .filter(t => t.recipient?.id === contactId && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalReceived = contactTransactions
    .filter(t => t.sender?.id === contactId && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const lastTransaction = contactTransactions.length > 0 
    ? contactTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
    : undefined;
  
  return {
    totalSent,
    totalReceived,
    transactionCount: contactTransactions.length,
    lastTransaction,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatCardNumber = (cardNumber: string, showFull: boolean = false): string => {
  if (showFull) return cardNumber;
  return `•••• •••• •••• ${cardNumber.slice(-4)}`;
};
