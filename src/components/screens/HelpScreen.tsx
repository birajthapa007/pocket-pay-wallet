import { ArrowLeft, MessageCircle, Mail, ChevronRight } from 'lucide-react';

interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen = ({ onBack }: HelpScreenProps) => {
  const faqs = [
    'How do I add money?',
    'How long do transfers take?',
    'Is my money safe?',
    'What are the limits?',
  ];

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Help</h1>
      </div>

      {/* Contact */}
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Contact us</p>
      <div className="card-subtle mb-8">
        <button className="menu-item w-full -my-1">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="flex-1 text-left font-medium">Chat with us</span>
          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Online</span>
        </button>
      </div>

      {/* FAQs */}
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Common questions</p>
      <div className="menu-list">
        {faqs.map((faq) => (
          <button key={faq} className="menu-item w-full">
            <span className="flex-1 text-left font-medium">{faq}</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Email */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Or email us at</p>
        <a href="mailto:help@pocketpay.app" className="text-primary font-medium">
          help@pocketpay.app
        </a>
      </div>
    </div>
  );
};

export default HelpScreen;
