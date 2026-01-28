import { useState } from 'react';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { User } from '@/types/wallet';

interface SendScreenProps {
  contacts: User[];
  onSelectRecipient: (user: User) => void;
  onBack: () => void;
}

const SendScreen = ({ contacts, onSelectRecipient, onBack }: SendScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-primary to-primary/70',
      'from-success to-success/70',
      'from-info to-info/70',
      'from-warning to-warning/70',
      'from-accent to-accent/70',
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Send Money</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or username"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mobile-input pl-12"
          autoFocus
        />
      </div>

      {/* Contacts */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">Contacts</p>
        </div>
        
        {filteredContacts.map((contact, i) => (
          <button
            key={contact.id}
            onClick={() => onSelectRecipient(contact)}
            className="w-full transaction-item animate-fade-in"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-primary-foreground font-semibold bg-gradient-to-br ${getAvatarGradient(contact.name)}`}>
              {getInitials(contact.name)}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">{contact.name}</p>
              <p className="text-sm text-muted-foreground">@{contact.username}</p>
            </div>
          </button>
        ))}

        {filteredContacts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No contacts found</p>
            <p className="text-sm mt-1">Try a different search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendScreen;
