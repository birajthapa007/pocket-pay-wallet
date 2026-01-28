export interface User {
  id: string;
  name: string;
  username: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdrawal';
  amount: number;
  status: 'completed' | 'pending' | 'blocked';
  description: string;
  recipient?: User;
  sender?: User;
  createdAt: Date;
  isRisky?: boolean;
}

export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

export interface InsightData {
  monthlySpend: number;
  monthlyReceived: number;
  fraudBlocked: number;
  transactionCount: number;
}

export type Screen = 
  | 'onboarding'
  | 'home'
  | 'send'
  | 'send-amount'
  | 'send-confirm'
  | 'receive'
  | 'history'
  | 'insights';
