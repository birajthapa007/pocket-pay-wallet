import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '@/types/wallet';
import { toast } from '@/hooks/use-toast';

const SETTINGS_STORAGE_KEY = 'pocket_pay_settings';

const defaultSettings: UserSettings = {
  notifications: { transactions: true, security: true, marketing: false },
  security: { biometric: false, twoFactor: true },
  privacy: { hideBalance: false, privateMode: false },
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          notifications: { ...defaultSettings.notifications, ...parsed.notifications },
          security: { ...defaultSettings.security, ...parsed.security },
          privacy: { ...defaultSettings.privacy, ...parsed.privacy },
        });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }
  }, [settings, isLoaded]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      
      if (updates.notifications) {
        newSettings.notifications = { ...prev.notifications, ...updates.notifications };
      }
      if (updates.security) {
        newSettings.security = { ...prev.security, ...updates.security };
      }
      if (updates.privacy) {
        newSettings.privacy = { ...prev.privacy, ...updates.privacy };
      }
      
      return newSettings;
    });
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
  }, []);

  const toggleSecuritySetting = useCallback((key: keyof UserSettings['security']) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: !prev.security[key],
      },
    }));
    
    toast({
      title: "Security updated",
      description: `${key === 'biometric' ? 'Biometric login' : 'Two-factor auth'} ${settings.security[key] ? 'disabled' : 'enabled'}`,
    });
  }, [settings.security]);

  const togglePrivacySetting = useCallback((key: keyof UserSettings['privacy']) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key],
      },
    }));
    
    toast({
      title: "Privacy updated",
      description: `${key === 'hideBalance' ? 'Balance visibility' : 'Private mode'} ${settings.privacy[key] ? 'disabled' : 'enabled'}`,
    });
  }, [settings.privacy]);

  const toggleNotification = useCallback((key: keyof UserSettings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
    
    const labels = {
      transactions: 'Transaction alerts',
      security: 'Security alerts',
      marketing: 'Marketing notifications',
    };
    
    toast({
      title: "Notifications updated",
      description: `${labels[key]} ${settings.notifications[key] ? 'disabled' : 'enabled'}`,
    });
  }, [settings.notifications]);

  return {
    settings,
    isLoaded,
    updateSettings,
    toggleSecuritySetting,
    togglePrivacySetting,
    toggleNotification,
  };
}