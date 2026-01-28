import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-primary',
      'bg-success',
      'bg-info',
      'bg-warning',
      'bg-accent',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
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
        />
      </div>

      {/* Contacts */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium mb-3">Contacts</p>
        
        {filteredContacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelectRecipient(contact)}
            className="w-full transaction-item"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground font-semibold ${getAvatarColor(contact.name)}`}>
              {getInitials(contact.name)}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">{contact.name}</p>
              <p className="text-sm text-muted-foreground">@{contact.username}</p>
            </div>
          </button>
        ))}

        {filteredContacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No contacts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendScreen;
