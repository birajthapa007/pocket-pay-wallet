import { ArrowLeft, MessageCircle, Mail, ChevronRight, HelpCircle, Book, Shield, CreditCard } from 'lucide-react';

interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen = ({ onBack }: HelpScreenProps) => {
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
    <div className="screen-container animate-fade-in min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
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
            <button key={i} className="settings-item w-full">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">{item.question}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Contact Us</p>
        <div className="menu-section">
          {contactItems.map((item, i) => (
            <button key={i} className="settings-item w-full">
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              {item.available && (
                <span className="text-xs px-2 py-1 rounded-full bg-success-soft text-success font-medium">
                  Available
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency */}
      <div className="p-5 bg-destructive-soft rounded-2xl border border-destructive/20">
        <p className="font-semibold text-foreground mb-1">Report Fraud</p>
        <p className="text-sm text-muted-foreground mb-3">
          If you suspect unauthorized activity on your account, report it immediately.
        </p>
        <button className="text-sm font-medium text-destructive hover:underline">
          Report Suspicious Activity →
        </button>
      </div>
    </div>
  );
};

export default HelpScreen;
