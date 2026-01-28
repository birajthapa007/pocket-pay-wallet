import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { User } from '@/types/wallet';

interface RequestScreenProps {
  contacts: User[];
  onSelectRecipient: (user: User) => void;
  onBack: () => void;
}

const RequestScreen = ({ contacts, onSelectRecipient, onBack }: RequestScreenProps) => {
  const [query, setQuery] = useState('');

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.username.toLowerCase().includes(query.toLowerCase())
  );

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Request</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Who do you want to request from?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-clean pl-8"
          autoFocus
        />
      </div>

      {/* Contacts */}
      <div className="space-y-1">
        {filtered.map((contact, i) => (
          <button
            key={contact.id}
            onClick={() => onSelectRecipient(contact)}
            className="menu-item w-full animate-fade-in"
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-semibold">
              {getInitials(contact.name)}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">{contact.name}</p>
              <p className="text-sm text-muted-foreground">@{contact.username}</p>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No one found
          </p>
        )}
      </div>
    </div>
  );
};

export default RequestScreen;
