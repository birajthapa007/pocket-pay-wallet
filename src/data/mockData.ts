import { User, Transaction, WalletBalance } from '@/types/wallet';

export const currentUser: User = {
  id: '1',
  name: 'Alex Johnson',
  username: 'alexj',
  phone: '+1 (555) 123-4567',
  email: 'alex@email.com',
};

export const contacts: User[] = [
  { id: '2', name: 'Sarah Miller', username: 'sarahm' },
  { id: '3', name: 'Mike Chen', username: 'mikec' },
  { id: '4', name: 'Emily Davis', username: 'emilyd' },
  { id: '5', name: 'James Wilson', username: 'jamesw' },
  { id: '6', name: 'Lisa Brown', username: 'lisab' },
  { id: '7', name: 'David Kim', username: 'davidk' },
];

export const walletBalance: WalletBalance = {
  available: 2847.52,
  pending: 150.00,
};

export const transactions: Transaction[] = [
  {
    id: 't1',
    type: 'receive',
    amount: 250.00,
    status: 'COMPLETED',
    description: 'For dinner',
    sender: contacts[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: 't2',
    type: 'send',
    amount: 45.00,
    status: 'COMPLETED',
    description: 'Coffee ☕',
    recipient: contacts[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: 't3',
    type: 'send',
    amount: 1200.00,
    status: 'PENDING_CONFIRMATION',
    description: 'Rent',
    recipient: contacts[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: 't4',
    type: 'receive',
    amount: 85.50,
    status: 'COMPLETED',
    description: 'Movie tickets',
    sender: contacts[3],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 't5',
    type: 'send',
    amount: 500.00,
    status: 'BLOCKED',
    description: 'Payment',
    recipient: { id: 'unknown', name: 'Unknown User', username: 'unknown' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: 't6',
    type: 'request',
    amount: 75.00,
    status: 'PENDING_CONFIRMATION',
    description: 'Utilities split',
    sender: contacts[4],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
  },
];

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
