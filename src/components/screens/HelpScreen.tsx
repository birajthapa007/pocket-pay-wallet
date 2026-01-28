import React from 'react';
import { ArrowLeft, MessageCircle, Mail, ChevronRight, HelpCircle, Book, Shield, CreditCard } from 'lucide-react';

interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen = React.forwardRef<HTMLDivElement, HelpScreenProps>(
  ({ onBack }, ref) => {
    const faqItems = [
      { icon: CreditCard, question: 'How do I add money?' },
      { icon: Shield, question: 'Is my money safe?' },
      { icon: HelpCircle, question: 'How do refunds work?' },
      { icon: Book, question: 'Transaction limits' },
    ];

    const contactItems = [
      { icon: MessageCircle, label: 'Live Chat', description: 'Chat with our support team', available: true },
      { icon: Mail, label: 'Email Support', description: 'support@pocketpay.app', available: true },
    ];

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
          <h1 className="text-2xl font-bold">Help & Support</h1>
        </div>

        {/* FAQs */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Frequently Asked</p>
          <div className="menu-section">
            {faqItems.map((item, i) => (
              <button key={i} className="settings-item w-full active:scale-[0.99]">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="flex-1 text-left font-medium text-foreground">{item.question}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Contact Us</p>
          <div className="menu-section">
            {contactItems.map((item, i) => (
              <button key={i} className="settings-item w-full active:scale-[0.99]">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                </div>
                {item.available && (
                  <span className="text-xs px-2 py-1 rounded-full bg-success-soft text-success font-medium flex-shrink-0">
                    Available
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency */}
        <div className="p-4 sm:p-5 bg-destructive-soft rounded-2xl border border-destructive/20">
          <p className="font-semibold text-foreground mb-1">Report Fraud</p>
          <p className="text-sm text-muted-foreground mb-3">
            If you suspect unauthorized activity on your account, report it immediately.
          </p>
          <button className="text-sm font-medium text-destructive hover:underline active:opacity-70">
            Report Suspicious Activity →
          </button>
        </div>
      </div>
    );
  }
);

HelpScreen.displayName = 'HelpScreen';

export default HelpScreen;
