import { useState } from 'react';
import { Screen, User, Transaction, UserSettings } from '@/types/wallet';
import { contacts, walletBalance, transactions as mockTransactions, currentUser } from '@/data/mockData';

import OnboardingScreen from '@/components/screens/OnboardingScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import SendScreen from '@/components/screens/SendScreen';
import SendAmountScreen from '@/components/screens/SendAmountScreen';
import SendConfirmScreen from '@/components/screens/SendConfirmScreen';
import SendResultScreen from '@/components/screens/SendResultScreen';
import ReceiveScreen from '@/components/screens/ReceiveScreen';
import RequestScreen from '@/components/screens/RequestScreen';
import RequestAmountScreen from '@/components/screens/RequestAmountScreen';
import HistoryScreen from '@/components/screens/HistoryScreen';
import TransactionDetailScreen from '@/components/screens/TransactionDetailScreen';
import InsightsScreen from '@/components/screens/InsightsScreen';
import SettingsScreen from '@/components/screens/SettingsScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import SecurityScreen from '@/components/screens/SecurityScreen';
import HelpScreen from '@/components/screens/HelpScreen';
import BottomNav from '@/components/navigation/BottomNav';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [sendResult, setSendResult] = useState<'COMPLETED' | 'PENDING_CONFIRMATION' | 'BLOCKED'>('COMPLETED');
  const [user, setUser] = useState<User>(currentUser);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: { transactions: true, security: true, marketing: false },
    security: { biometric: false, twoFactor: true },
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('home');
  };

  const handleSelectRecipient = (recipient: User) => {
    setSelectedRecipient(recipient);
    setCurrentScreen('send-amount');
  };

  const handleSetAmount = (amt: number) => {
    setAmount(amt);
    setCurrentScreen('send-confirm');
  };

  const handleConfirmSend = () => {
    // Simulate backend response
    const outcomes: ('COMPLETED' | 'PENDING_CONFIRMATION' | 'BLOCKED')[] = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING_CONFIRMATION'];
    const result = amount > 1000 ? 'PENDING_CONFIRMATION' : outcomes[Math.floor(Math.random() * outcomes.length)];
    
    const newTransaction: Transaction = {
      id: `t${Date.now()}`,
      type: 'send',
      amount,
      status: result,
      description: `To ${selectedRecipient?.name}`,
      recipient: selectedRecipient!,
      createdAt: new Date(),
    };
    
    if (result !== 'BLOCKED') {
      setTransactions([newTransaction, ...transactions]);
    }
    
    setSendResult(result);
    setCurrentScreen('send-result');
  };

  const handleSendComplete = () => {
    setSelectedRecipient(null);
    setAmount(0);
    setCurrentScreen('home');
  };

  const handleSelectRequestRecipient = (recipient: User) => {
    setSelectedRecipient(recipient);
    setCurrentScreen('request-amount');
  };

  const handleRequestAmount = (amt: number) => {
    const newTransaction: Transaction = {
      id: `t${Date.now()}`,
      type: 'request',
      amount: amt,
      status: 'PENDING_CONFIRMATION',
      description: `Requested from ${selectedRecipient?.name}`,
      sender: selectedRecipient!,
      createdAt: new Date(),
    };
    setTransactions([newTransaction, ...transactions]);
    setSelectedRecipient(null);
    setCurrentScreen('home');
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setCurrentScreen('transaction-detail');
  };

  const navScreens = ['home', 'history', 'insights', 'settings'];
  const showNav = isLoggedIn && navScreens.includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen onComplete={handleLogin} />;
      case 'home':
        return (
          <HomeScreen
            balance={walletBalance}
            transactions={transactions.slice(0, 5)}
            user={user}
            onSend={() => setCurrentScreen('send')}
            onReceive={() => setCurrentScreen('receive')}
            onRequest={() => setCurrentScreen('request')}
            onViewHistory={() => setCurrentScreen('history')}
            onViewTransaction={handleViewTransaction}
          />
        );
      case 'send':
        return (
          <SendScreen
            contacts={contacts}
            onSelectRecipient={handleSelectRecipient}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'send-amount':
        return (
          <SendAmountScreen
            recipient={selectedRecipient!}
            balance={walletBalance.available}
            onSetAmount={handleSetAmount}
            onBack={() => setCurrentScreen('send')}
          />
        );
      case 'send-confirm':
        return (
          <SendConfirmScreen
            recipient={selectedRecipient!}
            amount={amount}
            onConfirm={handleConfirmSend}
            onBack={() => setCurrentScreen('send-amount')}
          />
        );
      case 'send-result':
        return (
          <SendResultScreen
            recipient={selectedRecipient!}
            amount={amount}
            status={sendResult}
            onDone={handleSendComplete}
          />
        );
      case 'receive':
        return <ReceiveScreen user={user} onBack={() => setCurrentScreen('home')} />;
      case 'request':
        return (
          <RequestScreen
            contacts={contacts}
            onSelectRecipient={handleSelectRequestRecipient}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'request-amount':
        return (
          <RequestAmountScreen
            recipient={selectedRecipient!}
            onRequest={handleRequestAmount}
            onBack={() => setCurrentScreen('request')}
          />
        );
      case 'history':
        return (
          <HistoryScreen 
            transactions={transactions} 
            onViewTransaction={handleViewTransaction}
          />
        );
      case 'transaction-detail':
        return (
          <TransactionDetailScreen
            transaction={selectedTransaction!}
            onBack={() => setCurrentScreen('history')}
          />
        );
      case 'insights':
        return <InsightsScreen transactions={transactions} balance={walletBalance} />;
      case 'settings':
        return (
          <SettingsScreen
            user={user}
            onNavigate={setCurrentScreen}
            onLogout={() => {
              setIsLoggedIn(false);
              setCurrentScreen('onboarding');
            }}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            onUpdate={(updates) => setUser({ ...user, ...updates })}
            onBack={() => setCurrentScreen('settings')}
          />
        );
      case 'security':
        return (
          <SecurityScreen
            settings={settings}
            onUpdate={(updates) => setSettings({ ...settings, ...updates })}
            onBack={() => setCurrentScreen('settings')}
          />
        );
      case 'help':
        return <HelpScreen onBack={() => setCurrentScreen('settings')} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={showNav ? 'pb-24' : ''}>
        {renderScreen()}
      </div>
      {showNav && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
};

export default Index;
