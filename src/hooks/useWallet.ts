import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi, transfersApi, requestsApi, transactionsApi, cardsApi } from '@/services/api';
import { WalletBalance, Transaction, User, Card } from '@/types/wallet';
import { toast } from '@/hooks/use-toast';

// Transform backend transaction to frontend format
function transformTransaction(tx: any): Transaction {
  // Use is_outgoing to determine the correct type for display
  // Backend always stores 'send' type, but we show 'receive' for the recipient
  const isOutgoing = tx.is_outgoing;
  const displayType = isOutgoing ? 'send' : 'receive';
  
  // For outgoing: show recipient. For incoming: show sender
  const displayPerson = isOutgoing ? tx.recipient : tx.sender;
  
  return {
    id: tx.id,
    type: displayType as Transaction['type'],
    amount: tx.amount,
    status: tx.status,
    description: tx.description,
    recipient: isOutgoing && tx.recipient ? {
      id: tx.recipient.id,
      name: tx.recipient.name,
      username: tx.recipient.username,
      email: tx.recipient.email,
      phone: tx.recipient.phone,
    } : undefined,
    sender: !isOutgoing && tx.sender ? {
      id: tx.sender.id,
      name: tx.sender.name,
      username: tx.sender.username,
      email: tx.sender.email,
      phone: tx.sender.phone,
    } : undefined,
    createdAt: new Date(tx.created_at),
    isRisky: tx.is_risky,
  };
}

// Transform backend card to frontend format
function transformCard(card: any): Card {
  return {
    id: card.id,
    type: card.type,
    lastFour: card.last_four,
    cardNumber: card.card_number || `•••• •••• •••• ${card.last_four}`,
    expiryDate: card.expiry_date,
    cvv: card.cvv || '•••',
    cardholderName: card.cardholder_name,
    isActive: card.is_active,
    isFrozen: card.is_frozen,
    createdAt: new Date(card.created_at),
  };
}

// ==========================================
// WALLET HOOKS
// ==========================================

export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => {
      const data = await walletApi.getBalance();
      return data as WalletBalance;
    },
    staleTime: 30000, // 30 seconds
  });
}

export function useWalletSummary() {
  return useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn: async () => {
      const data = await walletApi.getSummary();
      return {
        balance: data.balance,
        profile: data.profile,
        transactions: data.transactions.map(tx => transformTransaction(tx)),
        cards: data.cards.map(c => transformCard(c)),
      };
    },
    staleTime: 30000,
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const data = await walletApi.getContacts();
      return data.contacts.map((c): User => ({
        id: c.id,
        name: c.name,
        username: c.username,
        email: c.email,
        phone: c.phone,
      }));
    },
    staleTime: 60000, // 1 minute
  });
}

export function useLookupUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (username: string) => {
      const data = await walletApi.lookupUser(username);
      return {
        user: data.user as User & { wallet_id: string },
        wallet_id: data.wallet_id,
      };
    },
  });
}

// ==========================================
// TRANSACTION HOOKS
// ==========================================

export function useTransactions(params?: { limit?: number; type?: string; status?: string }) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      const data = await transactionsApi.list(params);
      return data.transactions.map(tx => transformTransaction(tx));
    },
    staleTime: 30000,
  });
}

export function useTransactionDetail(transactionId: string | null) {
  return useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: async () => {
      if (!transactionId) throw new Error('No transaction ID');
      const data = await transactionsApi.getDetail(transactionId);
      return transformTransaction(data.transaction);
    },
    enabled: !!transactionId,
  });
}

export function useInsights(period?: 'week' | 'month' | 'year') {
  return useQuery({
    queryKey: ['insights', period],
    queryFn: () => transactionsApi.getInsights(period),
    staleTime: 60000,
  });
}

// ==========================================
// TRANSFER HOOKS
// ==========================================

export function useSendMoney() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      recipient_wallet_id: string;
      amount: number;
      description: string;
    }) => {
      return transfersApi.send(params);
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      if (data.status === 'completed') {
        toast({
          title: "Money sent!",
          description: data.message,
        });
      } else if (data.status === 'pending_confirmation') {
        toast({
          title: "Transfer pending",
          description: data.message || "Please confirm this transfer",
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useConfirmTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (transactionId: string) => transfersApi.confirm(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Transfer confirmed",
        description: "Your money has been sent",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Confirmation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (transactionId: string) => transfersApi.cancel(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Transfer cancelled",
        description: "The transfer has been cancelled",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ==========================================
// REQUEST HOOKS
// ==========================================

export function useMoneyRequests() {
  return useQuery({
    queryKey: ['money-requests'],
    queryFn: () => requestsApi.list(),
    staleTime: 30000,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      requested_from_wallet_id: string;
      amount: number;
      note?: string;
    }) => {
      return requestsApi.create(params);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['money-requests'] });
      toast({
        title: "Request sent!",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAcceptRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId: string) => requestsApi.accept(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-requests'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Request paid",
        description: "Payment sent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeclineRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId: string) => requestsApi.decline(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-requests'] });
      toast({
        title: "Request declined",
      });
    },
  });
}

// ==========================================
// CARDS HOOKS
// ==========================================

export function useCards() {
  return useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const data = await cardsApi.list();
      return data.cards.map(c => transformCard(c));
    },
    staleTime: 60000,
  });
}

export function useCardDetail(cardId: string | null) {
  return useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('No card ID');
      const data = await cardsApi.getDetail(cardId);
      return transformCard(data.card);
    },
    enabled: !!cardId,
  });
}

export function useFreezeCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (cardId: string) => cardsApi.freeze(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'summary'] });
      toast({
        title: "Card frozen",
        description: "Your card has been temporarily frozen",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to freeze card",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUnfreezeCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (cardId: string) => cardsApi.unfreeze(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'summary'] });
      toast({
        title: "Card unfrozen",
        description: "Your card is now active",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unfreeze card",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => cardsApi.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'summary'] });
      toast({
        title: "Card created",
        description: "Your new virtual card is ready",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create card",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
