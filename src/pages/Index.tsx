import { useState } from 'react';
import { Screen, User, Transaction, UserSettings } from '@/types/wallet';
import { contacts, walletBalance, transactions as mockTransactions, currentUser } from '@/data/mockData';
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
import BottomNav from '@/components/navigation/BottomNav';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [requestAmount, setRequestAmount] = useState<number>(0);
  const [requestNote, setRequestNote] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [user, setUser] = useState<User>(currentUser);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: { transactions: true, security: true, marketing: false },
    security: { biometric: false, twoFactor: true },
    privacy: { hideBalance: false, privateMode: false },
  });
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('home');
  };

  const handleSelectRecipient = (user: User) => {
    setSelectedRecipient(user);
    setCurrentScreen('send-amount');
  };

  const handleSelectRequestFrom = (user: User) => {
    setSelectedRecipient(user);
    setCurrentScreen('request-amount');
  };

  const handleSetAmount = (amount: number) => {
    setSendAmount(amount);
    setCurrentScreen('send-confirm');
  };

  const handleSetRequestAmount = (amount: number, note: string) => {
    setRequestAmount(amount);
    setRequestNote(note);
    setCurrentScreen('request-success');
  };

  const handleConfirmSend = () => {
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
    setCurrentScreen('send-success');
  };

  const handleSendComplete = () => {
    setSelectedRecipient(null);
    setSendAmount(0);
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
    setUser({ ...user, ...updates });
  };

  const handleUpdateSettings = (updates: Partial<UserSettings>) => {
    setSettings({ ...settings, ...updates });
  };

  const flowScreens = [
    'send', 'send-amount', 'send-confirm', 'send-success', 
    'receive', 'request', 'request-amount', 'request-success',
    'profile', 'security', 'notifications', 'help', 'cards', 
    'contact-profile', 'transaction-detail'
  ];
  const showNav = isLoggedIn && !flowScreens.includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen onComplete={handleLogin} />;
      case 'home':
        return (
          <HomeScreen
            balance={walletBalance}
            transactions={transactions.slice(0, 4)}
            user={user}
            hideBalance={settings.privacy.hideBalance}
            onSend={() => setCurrentScreen('send')}
            onReceive={() => setCurrentScreen('receive')}
            onRequest={() => setCurrentScreen('request')}
            onViewHistory={() => setCurrentScreen('history')}
            onOpenProfile={() => setCurrentScreen('settings')}
            onNavigate={handleNavigate}
            onTransactionClick={(t) => handleTransactionClick(t, 'home')}
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
      case 'send-success':
        return (
          <SendSuccessScreen
            recipient={selectedRecipient!}
            amount={sendAmount}
            onDone={handleSendComplete}
          />
        );
      case 'receive':
        return <ReceiveScreen user={user} onBack={() => setCurrentScreen('home')} />;
      case 'request':
        return (
          <RequestScreen
            contacts={contacts}
            onSelectRecipient={handleSelectRequestFrom}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'request-amount':
        return (
          <RequestAmountScreen
            requestFrom={selectedRecipient!}
            onSetAmount={handleSetRequestAmount}
            onBack={() => setCurrentScreen('request')}
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
            user={user}
            onNavigate={handleNavigate}
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
              setSelectedRecipient(selectedContact);
              setCurrentScreen('send-amount');
            }}
            onRequest={() => {
              setSelectedRecipient(selectedContact);
              setCurrentScreen('request-amount');
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
