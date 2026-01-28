import React, { useState } from 'react';
import { ArrowLeft, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { toast } from '@/hooks/use-toast';

interface ProfileScreenProps {
  user: User;
  onUpdate: (updates: Partial<User>) => void;
  onBack: () => void;
}

const ProfileScreen = React.forwardRef<HTMLDivElement, ProfileScreenProps>(
  ({ user, onUpdate, onBack }, ref) => {
    const [name, setName] = useState(user.name);
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = (setter: (v: string) => void, value: string) => {
      setter(value);
      setHasChanges(true);
    };

    const handleSave = () => {
      onUpdate({ name, username, email, phone });
      setHasChanges(false);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
    };

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    return (
      <div ref={ref} className="screen-container animate-fade-in min-h-screen safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-glow">
              {getInitials(name)}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors active:scale-95">
              <Camera className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 pb-24">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleChange(setName, e.target.value)}
              className="mobile-input"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => handleChange(setUsername, e.target.value)}
              className="mobile-input"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleChange(setEmail, e.target.value)}
              placeholder="your@email.com"
              className="mobile-input"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handleChange(setPhone, e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="mobile-input"
            />
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto animate-slide-up safe-bottom">
            <Button size="full" onClick={handleSave}>
              <Check className="w-5 h-5" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
    );
  }
);

ProfileScreen.displayName = 'ProfileScreen';

export default ProfileScreen;
