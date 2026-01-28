import React, { useState, useEffect, useRef } from 'react';
import { X, Flashlight, FlashlightOff, User as UserIcon, ArrowUpRight, HandCoins, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from '@/hooks/use-toast';

interface ScanScreenProps {
  onUserFound: (user: User, action: 'send' | 'request') => void;
  onBack: () => void;
}

interface QRPayload {
  type: string;
  version: number;
  username: string;
  userId: string;
}

const ScanScreen = React.forwardRef<HTMLDivElement, ScanScreenProps>(
  ({ onUserFound, onBack }, ref) => {
    const [isScanning, setIsScanning] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize scanner
    useEffect(() => {
      const initScanner = async () => {
        try {
          // Check camera permission first
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          stream.getTracks().forEach(track => track.stop());
          setCameraPermission('granted');
          
          // Create scanner instance
          scannerRef.current = new Html5Qrcode('qr-reader');
          setIsScanning(true);
          
          // Start scanning
          await scannerRef.current.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              handleQRCodeScanned(decodedText);
            },
            () => {
              // QR code not detected, continue scanning
            }
          );
        } catch (err: any) {
          console.error('Camera error:', err);
          if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
            setCameraPermission('denied');
            setError('Camera access denied. Please enable camera permissions.');
          } else {
            setError('Could not access camera. Please try again.');
          }
        }
      };

      initScanner();

      // Cleanup
      return () => {
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
      };
    }, []);

    const handleQRCodeScanned = async (data: string) => {
      // Stop scanning while processing
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }

      try {
        // Try to parse as Pocket Pay QR code
        const payload: QRPayload = JSON.parse(data);
        
        if (payload.type === 'pocketpay' && payload.username) {
          const user: User = {
            id: payload.userId || payload.username,
            name: payload.username, // Will be looked up by parent
            username: payload.username,
          };
          setFoundUser(user);
          toast({
            title: "User found!",
            description: `@${payload.username}`,
          });
        } else {
          throw new Error('Invalid QR code format');
        }
      } catch (e) {
        // Not a valid Pocket Pay QR code
        toast({
          title: "Invalid QR Code",
          description: "This doesn't appear to be a Pocket Pay QR code",
          variant: "destructive",
        });
        // Resume scanning
        handleRescan();
      }
    };

    const handleRescan = async () => {
      setFoundUser(null);
      setError(null);
      
      if (scannerRef.current && !scannerRef.current.isScanning) {
        try {
          await scannerRef.current.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              handleQRCodeScanned(decodedText);
            },
            () => {}
          );
          setIsScanning(true);
        } catch (err) {
          console.error('Failed to restart scanner:', err);
          setError('Failed to restart camera');
        }
      }
    };

    const toggleFlash = async () => {
      // Note: Flash control requires camera track access
      // This is a basic implementation - may need enhancement for specific devices
      setFlashOn(!flashOn);
      toast({
        title: flashOn ? "Flash off" : "Flash on",
        description: "Flash control depends on device support",
      });
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
              onClick={toggleFlash}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              {flashOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Camera background */}
          <div className="absolute inset-0 bg-black" />
          
          {/* QR Scanner Element */}
          <div 
            id="qr-reader" 
            ref={containerRef}
            className="absolute inset-0 w-full h-full"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />

          {/* Overlay with scan frame */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark overlay with transparent center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Scan frame corners */}
                <div className="w-64 h-64 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  
                  {/* Scanning animation */}
                  {isScanning && (
                    <div 
                      className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line"
                      style={{ 
                        boxShadow: '0 0 10px hsl(175 70% 50%), 0 0 20px hsl(175 70% 50% / 0.5)',
                        animation: 'scanLine 2s ease-in-out infinite'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Permission denied or error message */}
          {(cameraPermission === 'denied' || error) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <p className="text-white text-lg font-medium mb-2">Camera Access Required</p>
                <p className="text-white/70 text-sm mb-6">
                  {error || 'Please enable camera access in your browser settings to scan QR codes.'}
                </p>
                <Button variant="secondary" onClick={onBack}>
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {/* Hint text */}
          {!foundUser && cameraPermission === 'granted' && (
            <div className="absolute bottom-32 left-0 right-0 text-center z-10">
              <p className="text-white/70 text-sm">
                Point camera at a Pocket Pay QR code
              </p>
            </div>
          )}
        </div>

        {/* Found User Bottom Sheet */}
        {foundUser && (
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 animate-slide-up safe-bottom z-30">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
            
            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xl font-bold">
                {getInitials(foundUser.name || foundUser.username)}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-foreground">{foundUser.name || foundUser.username}</p>
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

        {/* Add CSS for scan animation */}
        <style>{`
          @keyframes scanLine {
            0%, 100% { top: 0; }
            50% { top: calc(100% - 2px); }
          }
          #qr-reader video {
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
          }
          #qr-reader {
            border: none !important;
          }
          #qr-reader > div {
            display: none !important;
          }
        `}</style>
      </div>
    );
  }
);

ScanScreen.displayName = 'ScanScreen';

export default ScanScreen;