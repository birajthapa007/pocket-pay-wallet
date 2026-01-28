import React, { useState } from 'react';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { User } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface RequestScreenProps {
  contacts: User[];
  onSelectRecipient: (user: User) => void;
  onBack: () => void;
}

const RequestScreen = React.forwardRef<HTMLDivElement, RequestScreenProps>(
  ({ contacts, onSelectRecipient, onBack }, ref) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredContacts = contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const getAvatarColor = (id: string) => {
      const colors = [
        'from-info to-info/70',
        'from-success to-success/70',
        'from-warning to-warning/70',
        'from-primary to-primary/70',
        'from-destructive to-destructive/70',
      ];
      const index = parseInt(id) % colors.length;
      return colors[index];
    };

    return (
      <div ref={ref} className="screen-container animate-fade-in safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Request Money</h1>
            <p className="text-muted-foreground text-sm">Choose who to request from</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name or username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-input pl-12"
          />
        </div>

        {/* Contacts List */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">Contacts</p>
          </div>

          <div className="space-y-2">
            {filteredContacts.map((contact, i) => (
              <button
                key={contact.id}
                onClick={() => onSelectRecipient(contact)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl",
                  "bg-secondary/50 hover:bg-secondary transition-all duration-200",
                  "animate-fade-in active:scale-[0.98]"
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold",
                  "bg-gradient-to-br",
                  getAvatarColor(contact.id)
                )}>
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
      </div>
    );
  }
);

RequestScreen.displayName = 'RequestScreen';

export default RequestScreen;
