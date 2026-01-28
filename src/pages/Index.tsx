import { useState } from 'react';
import { Screen, User, Transaction } from '@/types/wallet';
import { contacts, walletBalance, transactions as mockTransactions } from '@/data/mockData';
import OnboardingScreen from '@/components/screens/OnboardingScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import SendScreen from '@/components/screens/SendScreen';
import SendAmountScreen from '@/components/screens/SendAmountScreen';
import SendConfirmScreen from '@/components/screens/SendConfirmScreen';
import ReceiveScreen from '@/components/screens/ReceiveScreen';
import HistoryScreen from '@/components/screens/HistoryScreen';
import InsightsScreen from '@/components/screens/InsightsScreen';
import BottomNav from '@/components/navigation/BottomNav';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('home');
  };

  const handleSelectRecipient = (user: User) => {
    setSelectedRecipient(user);
    setCurrentScreen('send-amount');
  };

  const handleSetAmount = (amount: number) => {
    setSendAmount(amount);
    setCurrentScreen('send-confirm');
  };

  const handleConfirmSend = () => {
    // Add new transaction
    const newTransaction: Transaction = {
      id: `t${Date.now()}`,
      type: 'send',
      amount: sendAmount,
      status: 'completed',
      description: `Payment to ${selectedRecipient?.name}`,
      recipient: selectedRecipient!,
      createdAt: new Date(),
    };
    setTransactions([newTransaction, ...transactions]);
    
    // Reset and go home
    setSelectedRecipient(null);
    setSendAmount(0);
    setCurrentScreen('home');
  };

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const showNav = isLoggedIn && !['send', 'send-amount', 'send-confirm', 'receive'].includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen onComplete={handleLogin} />;
      case 'home':
        return (
          <HomeScreen
            balance={walletBalance}
            transactions={transactions.slice(0, 3)}
            onSend={() => setCurrentScreen('send')}
            onReceive={() => setCurrentScreen('receive')}
            onViewHistory={() => setCurrentScreen('history')}
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
            onSetAmount={handleSetAmount}
            onBack={() => setCurrentScreen('send')}
          />
        );
      case 'send-confirm':
        return (
          <SendConfirmScreen
            recipient={selectedRecipient!}
            amount={sendAmount}
            onConfirm={handleConfirmSend}
            onBack={() => setCurrentScreen('send-amount')}
          />
        );
      case 'receive':
        return <ReceiveScreen onBack={() => setCurrentScreen('home')} />;
      case 'history':
        return <HistoryScreen transactions={transactions} />;
      case 'insights':
        return <InsightsScreen transactions={transactions} />;
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
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default Index;
