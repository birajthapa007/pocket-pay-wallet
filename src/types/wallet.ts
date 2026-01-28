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
  type: 'send' | 'receive' | 'deposit' | 'withdrawal' | 'request';
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

export interface UserSettings {
  notifications: {
    transactions: boolean;
    security: boolean;
    marketing: boolean;
  };
  security: {
    biometric: boolean;
    twoFactor: boolean;
  };
  privacy: {
    hideBalance: boolean;
    privateMode: boolean;
  };
}

export interface Card {
  id: string;
  type: 'virtual' | 'physical';
  lastFour: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  isActive: boolean;
  isFrozen: boolean;
  createdAt: Date;
}

export interface MoneyRequest {
  id: string;
  amount: number;
  requester: User;
  requestedFrom?: User;
  note?: string;
  status: 'pending' | 'paid' | 'declined' | 'cancelled';
  createdAt: Date;
}

export interface ContactFinancials {
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  lastTransaction?: Date;
}

export type Screen = 
  | 'auth'
  | 'onboarding'
  | 'home'
  | 'send'
  | 'send-amount'
  | 'send-confirm'
  | 'send-success'
  | 'receive'
  | 'request'
  | 'request-amount'
  | 'request-success'
  | 'history'
  | 'insights'
  | 'settings'
  | 'profile'
  | 'security'
  | 'notifications'
  | 'help'
  | 'cards'
  | 'card-details'
  | 'contact-profile'
  | 'transaction-detail'
  | 'scan';
