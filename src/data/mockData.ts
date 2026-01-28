import { User, Transaction, WalletBalance, InsightData } from '@/types/wallet';

export const currentUser: User = {
  id: '1',
  name: 'Alex Johnson',
  username: 'alexj',
  phone: '+1 (555) 123-4567',
  email: 'alex@email.com',
};

export const contacts: User[] = [
  { id: '2', name: 'Sarah Miller', username: 'sarahm', avatar: undefined },
  { id: '3', name: 'Mike Chen', username: 'mikec', avatar: undefined },
  { id: '4', name: 'Emily Davis', username: 'emilyd', avatar: undefined },
  { id: '5', name: 'James Wilson', username: 'jamesw', avatar: undefined },
  { id: '6', name: 'Lisa Brown', username: 'lisab', avatar: undefined },
];

export const walletBalance: WalletBalance = {
  available: 2847.52,
  pending: 150.00,
  total: 2997.52,
};

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
    amount: 1200.00,
    status: 'pending',
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
];

export const insightData: InsightData = {
  monthlySpend: 1842.50,
  monthlyReceived: 3250.00,
  fraudBlocked: 500.00,
  transactionCount: 47,
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

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
