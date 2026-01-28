import React, { useState, useEffect } from 'react';
import { X, Flashlight, FlashlightOff, Camera, User as UserIcon, ArrowUpRight, HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { contacts } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface ScanScreenProps {
  onUserFound: (user: User, action: 'send' | 'request') => void;
  onBack: () => void;
}

const ScanScreen = React.forwardRef<HTMLDivElement, ScanScreenProps>(
  ({ onUserFound, onBack }, ref) => {
    const [isScanning, setIsScanning] = useState(true);
    const [flashOn, setFlashOn] = useState(false);
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [scanProgress, setScanProgress] = useState(0);

    // Simulate QR scan - in production this would use camera API
    useEffect(() => {
      if (isScanning && !foundUser) {
        const interval = setInterval(() => {
          setScanProgress(prev => {
            if (prev >= 100) {
              // Simulate finding a random user
              const randomUser = contacts[Math.floor(Math.random() * contacts.length)];
              setFoundUser(randomUser);
              setIsScanning(false);
              return 0;
            }
            return prev + 2;
          });
        }, 50);
        return () => clearInterval(interval);
      }
    }, [isScanning, foundUser]);

    const handleRescan = () => {
      setFoundUser(null);
      setScanProgress(0);
      setIsScanning(true);
    };

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    return (
      <div ref={ref} className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 safe-top">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-white font-semibold">Scan QR Code</p>
            <button
              onClick={() => setFlashOn(!flashOn)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              {flashOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Camera View (Simulated) */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Camera background simulation */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900" />
          
          {/* Scan Frame */}
          <div className="relative z-10">
            <div className="w-64 h-64 relative">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              
              {/* Scanning line animation */}
              {isScanning && (
                <div 
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                  style={{ 
                    top: `${scanProgress}%`,
                    boxShadow: '0 0 10px hsl(175 70% 50%), 0 0 20px hsl(175 70% 50% / 0.5)'
                  }}
                />
              )}
              
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-12 h-12 text-white/20" />
              </div>
            </div>
          </div>

          {/* Hint text */}
          <div className="absolute bottom-32 left-0 right-0 text-center">
            <p className="text-white/70 text-sm">
              {isScanning ? 'Point camera at a Pocket Pay QR code' : 'User found!'}
            </p>
          </div>
        </div>

        {/* Found User Bottom Sheet */}
        {foundUser && (
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 animate-slide-up safe-bottom">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
            
            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xl font-bold">
                {getInitials(foundUser.name)}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-foreground">{foundUser.name}</p>
                <p className="text-muted-foreground">@{foundUser.username}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-success-soft flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-success" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                variant="send"
                size="lg"
                onClick={() => onUserFound(foundUser, 'send')}
                className="flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-5 h-5" />
                Pay
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onUserFound(foundUser, 'request')}
                className="flex items-center justify-center gap-2 bg-info-soft border-info/20 hover:bg-info-soft/80 text-info-foreground"
              >
                <HandCoins className="w-5 h-5" />
                Request
              </Button>
            </div>

            <Button
              variant="ghost"
              size="full"
              onClick={handleRescan}
            >
              Scan Again
            </Button>
          </div>
        )}
      </div>
    );
  }
);

ScanScreen.displayName = 'ScanScreen';

export default ScanScreen;
