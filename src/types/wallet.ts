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
  type: 'send' | 'receive' | 'request' | 'deposit';
  amount: number;
  status: 'COMPLETED' | 'PENDING_CONFIRMATION' | 'BLOCKED' | 'FAILED';
  description: string;
  recipient?: User;
  sender?: User;
  createdAt: Date;
}

export interface WalletBalance {
  available: number;
  pending: number;
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
}

export type Screen = 
  | 'onboarding'
  | 'home'
  | 'send'
  | 'send-amount'
  | 'send-confirm'
  | 'send-result'
  | 'receive'
  | 'request'
  | 'request-amount'
  | 'history'
  | 'transaction-detail'
  | 'insights'
  | 'settings'
  | 'profile'
  | 'security'
  | 'help';
