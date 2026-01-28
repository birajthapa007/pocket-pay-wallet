import React from 'react';
import { ArrowLeft, FileText, Shield, CreditCard, AlertTriangle, Scale, Clock } from 'lucide-react';

interface TermsScreenProps {
  onBack: () => void;
}

const TermsScreen = React.forwardRef<HTMLDivElement, TermsScreenProps>(
  ({ onBack }, ref) => {
    const sections = [
      {
        icon: FileText,
        title: "1. Acceptance of Terms",
        content: `By accessing or using Pocket Pay ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.

These terms constitute a legally binding agreement between you and Pocket Pay. We may update these terms from time to time, and your continued use of the App constitutes acceptance of any changes.`
      },
      {
        icon: Shield,
        title: "2. Account Registration & Security",
        content: `To use Pocket Pay, you must:
• Be at least 18 years old
• Provide accurate and complete registration information
• Maintain the security of your account credentials
• Notify us immediately of any unauthorized access

You are responsible for all activities that occur under your account. We implement industry-standard security measures but cannot guarantee absolute security.`
      },
      {
        icon: CreditCard,
        title: "3. Payment Services",
        content: `Pocket Pay provides digital wallet and payment services including:
• Sending and receiving money between users
• Virtual card issuance for online transactions
• Bank deposits and withdrawals (simulated)
• Money request functionality

Transaction limits may apply. We reserve the right to delay, block, or reverse transactions that violate our policies or applicable laws.`
      },
      {
        icon: AlertTriangle,
        title: "4. Prohibited Activities",
        content: `You agree not to:
• Use the App for illegal purposes
• Attempt to circumvent security measures
• Engage in fraudulent transactions
• Harass or harm other users
• Use automated systems to access the App
• Violate any applicable laws or regulations

Violation may result in account suspension or termination.`
      },
      {
        icon: Scale,
        title: "5. Liability & Disclaimers",
        content: `Pocket Pay is provided "as is" without warranties of any kind. We are not liable for:
• Service interruptions or errors
• Unauthorized access to your account
• Third-party actions or content
• Indirect or consequential damages

Our total liability is limited to fees paid in the 12 months preceding the claim.`
      },
      {
        icon: Clock,
        title: "6. Termination",
        content: `Either party may terminate this agreement at any time. Upon termination:
• Your access to the App will be revoked
• Any pending transactions may be cancelled
• Remaining balance will be returned per our withdrawal policy
• We may retain data as required by law

These terms survive termination where applicable.`
      }
    ];

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
            <h1 className="text-2xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground text-sm">Last updated: January 2026</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome to Pocket Pay. These Terms of Service govern your use of our mobile payment application. 
            Please read them carefully before using our services.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div 
              key={index} 
              className="bg-card border border-border/50 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <section.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{section.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 mb-8 text-center">
          <p className="text-xs text-muted-foreground">
            For questions about these terms, contact support@pocketpay.app
          </p>
        </div>
      </div>
    );
  }
);

TermsScreen.displayName = 'TermsScreen';

export default TermsScreen;
