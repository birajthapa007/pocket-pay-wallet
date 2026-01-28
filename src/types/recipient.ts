import { User } from './wallet';

export interface RecipientWithWallet extends User {
  wallet_id: string;
}
