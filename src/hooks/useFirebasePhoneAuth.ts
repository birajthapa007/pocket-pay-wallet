// =========================================
// Firebase Phone Auth Hook
// Handles reCAPTCHA + phone OTP via Firebase
// =========================================

import { useState, useCallback, useRef } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase';

interface UseFirebasePhoneAuthReturn {
  sendOtp: (phoneNumber: string) => Promise<{ error: string | null }>;
  verifyOtp: (otp: string) => Promise<{ idToken: string | null; error: string | null }>;
  isRecaptchaReady: boolean;
  setupRecaptcha: (containerId: string) => void;
  resetRecaptcha: () => void;
}

export function useFirebasePhoneAuth(): UseFirebasePhoneAuthReturn {
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const setupRecaptcha = useCallback((containerId: string) => {
    try {
      // Clean up existing verifier
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          setIsRecaptchaReady(true);
        },
        'expired-callback': () => {
          setIsRecaptchaReady(false);
        },
      });

      recaptchaVerifierRef.current = verifier;
      
      // Render the recaptcha
      verifier.render().then(() => {
        setIsRecaptchaReady(true);
      }).catch((err) => {
        console.error('reCAPTCHA render error:', err);
      });
    } catch (err) {
      console.error('reCAPTCHA setup error:', err);
    }
  }, []);

  const resetRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      recaptchaVerifierRef.current = null;
    }
    setIsRecaptchaReady(false);
    confirmationResultRef.current = null;
  }, []);

  const sendOtp = useCallback(async (phoneNumber: string): Promise<{ error: string | null }> => {
    try {
      if (!recaptchaVerifierRef.current) {
        return { error: 'reCAPTCHA not initialized. Please refresh and try again.' };
      }

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmation;
      return { error: null };
    } catch (err: any) {
      console.error('Firebase sendOtp error:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/invalid-phone-number') {
        return { error: 'Invalid phone number format. Please include country code (e.g., +1).' };
      }
      if (err.code === 'auth/too-many-requests') {
        return { error: 'Too many attempts. Please try again later.' };
      }
      if (err.code === 'auth/captcha-check-failed') {
        return { error: 'Security verification failed. Please refresh and try again.' };
      }
      
      return { error: err.message || 'Failed to send verification code' };
    }
  }, []);

  const verifyOtp = useCallback(async (otp: string): Promise<{ idToken: string | null; error: string | null }> => {
    try {
      if (!confirmationResultRef.current) {
        return { idToken: null, error: 'No verification in progress. Please request a new code.' };
      }

      const result = await confirmationResultRef.current.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      return { idToken, error: null };
    } catch (err: any) {
      console.error('Firebase verifyOtp error:', err);
      
      if (err.code === 'auth/invalid-verification-code') {
        return { idToken: null, error: 'Invalid code. Please check and try again.' };
      }
      if (err.code === 'auth/code-expired') {
        return { idToken: null, error: 'Code expired. Please request a new one.' };
      }
      
      return { idToken: null, error: err.message || 'Verification failed' };
    }
  }, []);

  return {
    sendOtp,
    verifyOtp,
    isRecaptchaReady,
    setupRecaptcha,
    resetRecaptcha,
  };
}
