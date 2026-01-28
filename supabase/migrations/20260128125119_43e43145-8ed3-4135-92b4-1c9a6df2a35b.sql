-- Create atomic balance debit function to prevent race conditions
-- This uses FOR UPDATE to lock the wallet row during the transaction

CREATE OR REPLACE FUNCTION public.atomic_debit_balance(
  p_wallet_id uuid,
  p_amount numeric,
  p_transaction_id uuid,
  p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Lock the wallet row to prevent concurrent modifications
  SELECT id INTO v_current_balance 
  FROM wallets 
  WHERE id = p_wallet_id 
  FOR UPDATE;
  
  -- Get current balance
  SELECT COALESCE(SUM(amount), 0) INTO v_current_balance
  FROM ledger_entries
  WHERE wallet_id = p_wallet_id;
  
  -- Check if sufficient funds
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient funds',
      'available', v_current_balance,
      'required', p_amount
    );
  END IF;
  
  -- Insert the debit entry
  INSERT INTO ledger_entries (wallet_id, amount, reference_transaction_id, description)
  VALUES (p_wallet_id, -p_amount, p_transaction_id, p_description);
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount_debited', p_amount
  );
END;
$$;

-- Create atomic credit function (doesn't need balance check but maintains consistency)
CREATE OR REPLACE FUNCTION public.atomic_credit_balance(
  p_wallet_id uuid,
  p_amount numeric,
  p_transaction_id uuid,
  p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  -- Lock the wallet row
  PERFORM id FROM wallets WHERE id = p_wallet_id FOR UPDATE;
  
  -- Insert the credit entry
  INSERT INTO ledger_entries (wallet_id, amount, reference_transaction_id, description)
  VALUES (p_wallet_id, p_amount, p_transaction_id, p_description);
  
  -- Get new balance
  SELECT COALESCE(SUM(amount), 0) INTO v_new_balance
  FROM ledger_entries
  WHERE wallet_id = p_wallet_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'amount_credited', p_amount
  );
END;
$$;

-- Create atomic transfer function that handles both debit and credit atomically
CREATE OR REPLACE FUNCTION public.atomic_transfer(
  p_sender_wallet_id uuid,
  p_recipient_wallet_id uuid,
  p_amount numeric,
  p_transaction_id uuid,
  p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_balance numeric;
  v_debit_result jsonb;
BEGIN
  -- Lock both wallets in consistent order to prevent deadlocks
  IF p_sender_wallet_id < p_recipient_wallet_id THEN
    PERFORM id FROM wallets WHERE id = p_sender_wallet_id FOR UPDATE;
    PERFORM id FROM wallets WHERE id = p_recipient_wallet_id FOR UPDATE;
  ELSE
    PERFORM id FROM wallets WHERE id = p_recipient_wallet_id FOR UPDATE;
    PERFORM id FROM wallets WHERE id = p_sender_wallet_id FOR UPDATE;
  END IF;
  
  -- Get sender's current balance
  SELECT COALESCE(SUM(amount), 0) INTO v_sender_balance
  FROM ledger_entries
  WHERE wallet_id = p_sender_wallet_id;
  
  -- Check if sufficient funds
  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient funds',
      'available', v_sender_balance,
      'required', p_amount
    );
  END IF;
  
  -- Debit sender
  INSERT INTO ledger_entries (wallet_id, amount, reference_transaction_id, description)
  VALUES (p_sender_wallet_id, -p_amount, p_transaction_id, 'Sent: ' || p_description);
  
  -- Credit recipient
  INSERT INTO ledger_entries (wallet_id, amount, reference_transaction_id, description)
  VALUES (p_recipient_wallet_id, p_amount, p_transaction_id, 'Received: ' || p_description);
  
  RETURN jsonb_build_object(
    'success', true,
    'sender_previous_balance', v_sender_balance,
    'sender_new_balance', v_sender_balance - p_amount,
    'amount_transferred', p_amount
  );
END;
$$;