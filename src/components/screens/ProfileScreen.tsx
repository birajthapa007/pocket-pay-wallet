import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { toast } from '@/hooks/use-toast';

interface ProfileScreenProps {
  user: User;
  onUpdate: (updates: Partial<User>) => void;
  onBack: () => void;
}

const ProfileScreen = ({ user, onUpdate, onBack }: ProfileScreenProps) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate({ name, phone });
    setHasChanges(false);
    toast({ title: "Saved" });
  };

  return (
    <div className="screen-container animate-fade-in min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Personal info</h1>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleChange(setName, e.target.value)}
            className="input-clean"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Username</label>
          <div className="input-clean text-muted-foreground">${user.username}</div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handleChange(setPhone, e.target.value)}
            className="input-clean"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      {/* Save */}
      {hasChanges && (
        <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto animate-slide-up">
          <Button variant="pay" size="full" onClick={handleSave}>
            <Check className="w-5 h-5" />
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
