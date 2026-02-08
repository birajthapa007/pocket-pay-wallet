// =========================================
// FIREBASE CLIENT - Phone Auth Only
// Used exclusively for phone number OTP verification
// Supabase remains the primary auth system
// =========================================

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC5MNvdJwNyGyebhNopUC5fEsVWcyMs5ZQ",
  authDomain: "pocket-pay-300bc.firebaseapp.com",
  projectId: "pocket-pay-300bc",
  storageBucket: "pocket-pay-300bc.firebasestorage.app",
  messagingSenderId: "380464942448",
  appId: "1:380464942448:web:7eb34e89ddab58514d93b5",
  measurementId: "G-N7LVW31R8J",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Disable app verification for testing (remove in production)
// auth.settings.appVerificationDisabledForTesting = true;

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
