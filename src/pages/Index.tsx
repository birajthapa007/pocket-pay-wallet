import { useState, useEffect } from 'react';
import { Screen, User, Transaction, WalletBalance } from '@/types/wallet';
import { RecipientWithWallet } from '@/types/recipient';
import { useAuth } from '@/hooks/useAuth';
import { useWalletSummary, useTransactions, useContacts, useSendMoney, useCreateRequest, useLookupUser, useMoneyRequests, useAcceptRequest, useDeclineRequest } from '@/hooks/useWallet';
import { useSettings } from '@/hooks/useSettings';
import { useDeposit, useWithdraw } from '@/hooks/useBanking';
import { formatCurrency } from '@/data/mockData';
import AuthScreen from '@/components/screens/AuthScreen';
import OnboardingScreen from '@/components/screens/OnboardingScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import SendScreen from '@/components/screens/SendScreen';
import SendAmountScreen from '@/components/screens/SendAmountScreen';
import SendConfirmScreen from '@/components/screens/SendConfirmScreen';
import SendSuccessScreen from '@/components/screens/SendSuccessScreen';
import ReceiveScreen from '@/components/screens/ReceiveScreen';
import RequestScreen from '@/components/screens/RequestScreen';
import RequestAmountScreen from '@/components/screens/RequestAmountScreen';
import RequestSuccessScreen from '@/components/screens/RequestSuccessScreen';
import HistoryScreen from '@/components/screens/HistoryScreen';
import InsightsScreen from '@/components/screens/InsightsScreen';
import SettingsScreen from '@/components/screens/SettingsScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import SecurityScreen from '@/components/screens/SecurityScreen';
import NotificationsScreen from '@/components/screens/NotificationsScreen';
import HelpScreen from '@/components/screens/HelpScreen';
import CardsScreen from '@/components/screens/CardsScreen';
import ContactProfileScreen from '@/components/screens/ContactProfileScreen';
import TransactionDetailScreen from '@/components/screens/TransactionDetailScreen';
import ScanScreen from '@/components/screens/ScanScreen';
import DepositScreen from '@/components/screens/DepositScreen';
import WithdrawScreen from '@/components/screens/WithdrawScreen';
import BottomNav from '@/components/navigation/BottomNav';

const Index = () => {
  const { isLoggedIn, isLoading: isAuthLoading, user, signOut, updateUser } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientWithWallet | null>(null);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [sendNote, setSendNote] = useState<string>('');
  const [requestAmount, setRequestAmount] = useState<number>(0);
  const [requestNote, setRequestNote] = useState<string>('');
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');

  // Fetch data from backend
  const { data: walletData, isLoading: isWalletLoading, refetch: refetchWallet } = useWalletSummary();
  const { data: allTransactions = [], refetch: refetchTransactions } = useTransactions();
  const { data: contacts = [] } = useContacts();
  const { data: moneyRequests, refetch: refetchRequests } = useMoneyRequests();
  const sendMoney = useSendMoney();
  const createRequest = useCreateRequest();
  const acceptRequest = useAcceptRequest();
  const declineRequest = useDeclineRequest();
  const lookupUser = useLookupUser();
  const deposit = useDeposit();
  const withdraw = useWithdraw();

  // Navigate based on auth state
  useEffect(() => {
    if (!isAuthLoading) {
      if (isLoggedIn && currentScreen === 'auth') {
        setCurrentScreen('home');
      } else if (!isLoggedIn) {
        setCurrentScreen('auth');
      }
    }
  }, [isLoggedIn, isAuthLoading]);

  // Derived state
  const balance: WalletBalance = walletData?.balance || { available: 0, pending: 0, total: 0 };
  const transactions = allTransactions.length > 0 ? allTransactions : (walletData?.transactions || []);

  const handleAuthSuccess = () => {
    setCurrentScreen('home');
  };

  const handleSelectRecipient = async (selectedUser: User) => {
    // Look up the user's wallet ID
    try {
      const result = await lookupUser.mutateAsync(selectedUser.username);
      setSelectedRecipient({
        ...selectedUser,
        id: result.user.id,
        wallet_id: result.wallet_id,
      });
      setCurrentScreen('send-amount');
    } catch (error) {
      console.error('Failed to lookup user:', error);
      // Still proceed but without wallet_id - will fail on send
      setSelectedRecipient({
        ...selectedUser,
        wallet_id: '',
      });
      setCurrentScreen('send-amount');
    }
  };

  const handleSelectRequestFrom = async (selectedUser: User) => {
    try {
      const result = await lookupUser.mutateAsync(selectedUser.username);
      setSelectedRecipient({
        ...selectedUser,
        id: result.user.id,
        wallet_id: result.wallet_id,
      });
      setCurrentScreen('request-amount');
    } catch (error) {
      console.error('Failed to lookup user:', error);
      setSelectedRecipient({
        ...selectedUser,
        wallet_id: '',
      });
      setCurrentScreen('request-amount');
    }
  };

  const handleSetAmount = (amount: number, note: string) => {
    setSendAmount(amount);
    setSendNote(note);
    setCurrentScreen('send-confirm');
  };

  const handleSetRequestAmount = async (amount: number, note: string) => {
    setRequestAmount(amount);
    setRequestNote(note);
    
    // Send the request to backend
    if (selectedRecipient?.wallet_id) {
      try {
        await createRequest.mutateAsync({
          requested_from_wallet_id: selectedRecipient.wallet_id,
          amount,
          note: note || undefined,
        });
        setCurrentScreen('request-success');
      } catch (error) {
        // Error is handled by the hook
        console.error('Request failed:', error);
      }
    } else {
      // Fallback for demo - just show success
      setCurrentScreen('request-success');
    }
  };

  const handleConfirmSend = async () => {
    if (!selectedRecipient?.wallet_id) {
      console.error('No recipient wallet ID');
      return;
    }

    try {
      const result = await sendMoney.mutateAsync({
        recipient_wallet_id: selectedRecipient.wallet_id,
        amount: sendAmount,
        description: sendNote,
      });

      // Store the transaction for the success screen
      if (result.transaction) {
        setLastTransaction({
          id: result.transaction.id,
          type: 'send',
          amount: sendAmount,
          status: result.transaction.status as Transaction['status'],
          description: sendNote,
          recipient: selectedRecipient,
          createdAt: new Date(),
          isRisky: result.transaction.is_risky,
        });
      }

      // Refresh wallet data
      refetchWallet();
      refetchTransactions();
      
      setCurrentScreen('send-success');
    } catch (error) {
      // Error handled by hook's onError
      console.error('Send failed:', error);
    }
  };

  const handleSendComplete = () => {
    setSelectedRecipient(null);
    setSendAmount(0);
    setSendNote('');
    setLastTransaction(null);
    setCurrentScreen('home');
  };

  const handleRequestComplete = () => {
    setSelectedRecipient(null);
    setRequestAmount(0);
    setRequestNote('');
    setCurrentScreen('home');
  };

  const handleTransactionClick = (transaction: Transaction, fromScreen: Screen = 'home') => {
    setSelectedTransaction(transaction);
    setPreviousScreen(fromScreen);
    setCurrentScreen('transaction-detail');
  };

  const handleViewContactFromTransaction = () => {
    if (selectedTransaction) {
      const contact = selectedTransaction.recipient || selectedTransaction.sender;
      if (contact && contact.id !== 'unknown') {
        setSelectedContact(contact);
        setCurrentScreen('contact-profile');
      }
    }
  };

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    updateUser(updates);
  };

  const handleUpdateSettings = updateSettings;

  const handleLogout = async () => {
    await signOut();
    setCurrentScreen('auth');
  };

  const flowScreens = [
    'auth', 'send', 'send-amount', 'send-confirm', 'send-success', 
    'receive', 'request', 'request-amount', 'request-success',
    'profile', 'security', 'notifications', 'help', 'cards', 
    'contact-profile', 'transaction-detail', 'scan', 'deposit', 'withdraw'
  ];
  const showNav = isLoggedIn && !flowScreens.includes(currentScreen);

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen onSuccess={handleAuthSuccess} />;
      case 'onboarding':
        return <OnboardingScreen onComplete={() => setCurrentScreen('home')} />;
      case 'home':
        return (
          <HomeScreen
            balance={balance}
            transactions={transactions.slice(0, 4)}
            user={user || { id: '', name: 'User', username: 'user' }}
            hideBalance={settings.privacy.hideBalance}
            incomingRequests={moneyRequests?.incoming || []}
            outgoingRequests={moneyRequests?.outgoing || []}
            onSend={() => setCurrentScreen('send')}
            onReceive={() => setCurrentScreen('receive')}
            onRequest={() => setCurrentScreen('request')}
            onScan={() => setCurrentScreen('scan')}
            onDeposit={() => setCurrentScreen('deposit')}
            onWithdraw={() => setCurrentScreen('withdraw')}
            onViewHistory={() => setCurrentScreen('history')}
            onOpenProfile={() => setCurrentScreen('settings')}
            onNavigate={handleNavigate}
            onTransactionClick={(t) => handleTransactionClick(t, 'home')}
            onAcceptRequest={(id) => {
              acceptRequest.mutate(id, {
                onSuccess: () => {
                  refetchWallet();
                  refetchTransactions();
                  refetchRequests();
                }
              });
            }}
            onDeclineRequest={(id) => {
              declineRequest.mutate(id, {
                onSuccess: () => {
                  refetchRequests();
                }
              });
            }}
            isLoading={isWalletLoading}
            isRequestLoading={acceptRequest.isPending || declineRequest.isPending}
          />
        );
      case 'send':
        return (
          <SendScreen
            contacts={contacts}
            onSelectRecipient={handleSelectRecipient}
            onBack={() => setCurrentScreen('home')}
            isLoading={lookupUser.isPending}
          />
        );
      case 'send-amount':
        return (
          <SendAmountScreen
            recipient={selectedRecipient!}
            balance={balance}
            onSetAmount={handleSetAmount}
            onBack={() => setCurrentScreen('send')}
          />
        );
      case 'send-confirm':
        return (
          <SendConfirmScreen
            recipient={selectedRecipient!}
            amount={sendAmount}
            note={sendNote}
            onConfirm={handleConfirmSend}
            onBack={() => setCurrentScreen('send-amount')}
            isLoading={sendMoney.isPending}
          />
        );
      case 'send-success':
        return (
          <SendSuccessScreen
            recipient={selectedRecipient!}
            amount={sendAmount}
            note={sendNote}
            transaction={lastTransaction}
            onDone={handleSendComplete}
          />
        );
      case 'receive':
        return <ReceiveScreen user={user || { id: '', name: 'User', username: 'user' }} onBack={() => setCurrentScreen('home')} />;
      case 'request':
        return (
          <RequestScreen
            contacts={contacts}
            onSelectRecipient={handleSelectRequestFrom}
            onBack={() => setCurrentScreen('home')}
            isLoading={lookupUser.isPending}
          />
        );
      case 'request-amount':
        return (
          <RequestAmountScreen
            requestFrom={selectedRecipient!}
            onSetAmount={handleSetRequestAmount}
            onBack={() => setCurrentScreen('request')}
            isLoading={createRequest.isPending}
          />
        );
      case 'request-success':
        return (
          <RequestSuccessScreen
            requestFrom={selectedRecipient!}
            amount={requestAmount}
            note={requestNote}
            onDone={handleRequestComplete}
          />
        );
      case 'history':
        return (
          <HistoryScreen 
            transactions={transactions} 
            onTransactionClick={(t) => handleTransactionClick(t, 'history')}
          />
        );
      case 'insights':
        return <InsightsScreen transactions={transactions} />;
      case 'settings':
        return (
          <SettingsScreen
            user={user || { id: '', name: 'User', username: 'user' }}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            user={user || { id: '', name: 'User', username: 'user' }}
            onUpdate={handleUpdateUser}
            onBack={() => setCurrentScreen('settings')}
          />
        );
      case 'security':
        return (
          <SecurityScreen
            settings={settings}
            onUpdate={handleUpdateSettings}
            onBack={() => setCurrentScreen('settings')}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            settings={settings}
            onUpdate={handleUpdateSettings}
            onBack={() => setCurrentScreen('settings')}
          />
        );
      case 'help':
        return <HelpScreen onBack={() => setCurrentScreen('settings')} />;
      case 'cards':
        return (
          <CardsScreen 
            onBack={() => setCurrentScreen('settings')} 
            onNavigate={handleNavigate}
          />
        );
      case 'contact-profile':
        return (
          <ContactProfileScreen
            contact={selectedContact!}
            transactions={transactions}
            onSend={() => {
              if (selectedContact) {
                lookupUser.mutateAsync(selectedContact.username).then((result) => {
                  setSelectedRecipient({
                    ...selectedContact,
                    wallet_id: result.wallet_id,
                  });
                  setCurrentScreen('send-amount');
                }).catch(() => {
                  setSelectedRecipient({
                    ...selectedContact,
                    wallet_id: '',
                  });
                  setCurrentScreen('send-amount');
                });
              }
            }}
            onRequest={() => {
              if (selectedContact) {
                lookupUser.mutateAsync(selectedContact.username).then((result) => {
                  setSelectedRecipient({
                    ...selectedContact,
                    wallet_id: result.wallet_id,
                  });
                  setCurrentScreen('request-amount');
                }).catch(() => {
                  setSelectedRecipient({
                    ...selectedContact,
                    wallet_id: '',
                  });
                  setCurrentScreen('request-amount');
                });
              }
            }}
            onBack={() => setCurrentScreen(previousScreen)}
          />
        );
      case 'transaction-detail':
        return (
          <TransactionDetailScreen
            transaction={selectedTransaction!}
            onBack={() => setCurrentScreen(previousScreen)}
            onViewProfile={handleViewContactFromTransaction}
            onNavigate={handleNavigate}
          />
        );
      case 'scan':
        return (
          <ScanScreen
            onUserFound={(foundUser, action) => {
              lookupUser.mutateAsync(foundUser.username).then((result) => {
                setSelectedRecipient({
                  ...foundUser,
                  wallet_id: result.wallet_id,
                });
                if (action === 'send') {
                  setCurrentScreen('send-amount');
                } else {
                  setCurrentScreen('request-amount');
                }
              }).catch(() => {
                setSelectedRecipient({
                  ...foundUser,
                  wallet_id: '',
                });
                if (action === 'send') {
                  setCurrentScreen('send-amount');
                } else {
                  setCurrentScreen('request-amount');
                }
              });
            }}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'deposit':
        return (
          <DepositScreen
            onDeposit={async (amount, bankName) => {
              await deposit.mutateAsync({ amount, bank_name: bankName });
              refetchWallet();
              refetchTransactions();
            }}
            onBack={() => setCurrentScreen('home')}
            isLoading={deposit.isPending}
          />
        );
      case 'withdraw':
        return (
          <WithdrawScreen
            balance={balance}
            onWithdraw={async (amount, speed, bankName) => {
              const result = await withdraw.mutateAsync({ amount, speed, bank_name: bankName });
              refetchWallet();
              refetchTransactions();
              return { fee: result.fee, total: result.total_debited };
            }}
            onBack={() => setCurrentScreen('home')}
            isLoading={withdraw.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={showNav ? 'pb-28' : ''}>
        {renderScreen()}
      </div>
      {showNav && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default Index;
