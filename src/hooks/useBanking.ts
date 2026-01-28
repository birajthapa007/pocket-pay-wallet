import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DepositResult {
  transaction: unknown;
  message: string;
  amount: number;
}

interface WithdrawResult {
  transaction: unknown;
  message: string;
  amount: number;
  fee: number;
  total_debited: number;
  estimated_arrival: string;
  speed: 'standard' | 'instant';
}

export const useDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, bank_name }: { amount: number; bank_name?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke<DepositResult>('banking', {
        body: { amount, bank_name },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Check for function-level HTTP errors
      const queryParams = new URLSearchParams({ action: 'deposit' });
      const fullResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/banking?${queryParams}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ amount, bank_name }),
        }
      );

      if (!fullResponse.ok) {
        const errorData = await fullResponse.json();
        throw new Error(errorData.error || 'Deposit failed');
      }

      return await fullResponse.json() as DepositResult;
    },
    onSuccess: (data) => {
      toast.success('Deposit successful!', {
        description: `$${data.amount.toFixed(2)} added to your wallet`,
      });
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: Error) => {
      toast.error('Deposit failed', {
        description: error.message,
      });
    },
  });
};

export const useWithdraw = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      amount, 
      speed, 
      bank_name 
    }: { 
      amount: number; 
      speed: 'standard' | 'instant'; 
      bank_name?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const queryParams = new URLSearchParams({ action: 'withdraw' });
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/banking?${queryParams}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ amount, speed, bank_name }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Withdrawal failed');
      }

      return await response.json() as WithdrawResult;
    },
    onSuccess: (data) => {
      const message = data.speed === 'instant' 
        ? 'Instant withdrawal complete!' 
        : 'Withdrawal initiated!';
      
      toast.success(message, {
        description: data.speed === 'instant'
          ? `$${data.amount.toFixed(2)} sent instantly (fee: $${data.fee.toFixed(2)})`
          : `$${data.amount.toFixed(2)} will arrive in 1-3 business days`,
      });
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: Error) => {
      toast.error('Withdrawal failed', {
        description: error.message,
      });
    },
  });
};
