import React from 'react';
import { ArrowLeft, Eye, Database, Share2, Shield, Lock, Trash2, Globe } from 'lucide-react';

interface PrivacyScreenProps {
  onBack: () => void;
}

const PrivacyScreen = React.forwardRef<HTMLDivElement, PrivacyScreenProps>(
  ({ onBack }, ref) => {
    const sections = [
      {
        icon: Database,
        title: "1. Information We Collect",
        content: `We collect information you provide directly:
• Account information (name, email, phone)
• Identity verification documents
• Transaction history and patterns
• Device and usage information

We also collect automatic data including IP addresses, device identifiers, and app usage analytics to improve our services.`
      },
      {
        icon: Eye,
        title: "2. How We Use Your Information",
        content: `Your information is used to:
• Provide and improve payment services
• Verify your identity and prevent fraud
• Process transactions securely
• Send important notifications
• Comply with legal requirements
• Personalize your experience

We use advanced fraud detection to protect your account and funds.`
      },
      {
        icon: Share2,
        title: "3. Information Sharing",
        content: `We may share your information with:
• Payment processors for transaction completion
• Identity verification services
• Law enforcement when legally required
• Service providers who assist our operations

We never sell your personal information to third parties for marketing purposes.`
      },
      {
        icon: Shield,
        title: "4. Data Security",
        content: `We protect your data with:
• End-to-end encryption for sensitive data
• AES-256 encryption for card information
• Multi-factor authentication options
• Regular security audits
• Secure data centers

Despite our measures, no system is 100% secure. Report suspicious activity immediately.`
      },
      {
        icon: Lock,
        title: "5. Your Privacy Rights",
        content: `You have the right to:
• Access your personal information
• Correct inaccurate data
• Request data deletion
• Opt-out of marketing communications
• Export your data
• Restrict certain processing

Exercise these rights through Settings or by contacting support.`
      },
      {
        icon: Trash2,
        title: "6. Data Retention",
        content: `We retain your data:
• Active account data: while your account is open
• Transaction records: 7 years (regulatory requirement)
• Marketing preferences: until you opt-out
• Deleted accounts: 30 days before permanent removal

Some data may be retained longer for legal compliance or fraud prevention.`
      },
      {
        icon: Globe,
        title: "7. International Transfers",
        content: `Your data may be processed in countries outside your residence. We ensure appropriate safeguards are in place, including:
• Standard contractual clauses
• Privacy Shield certification where applicable
• Adequacy decisions

We only transfer data to jurisdictions with appropriate data protection laws.`
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
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm">Last updated: January 2026</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            At Pocket Pay, we take your privacy seriously. This policy explains how we collect, 
            use, and protect your personal information when you use our services.
          </p>
        </div>

        {/* Privacy Summary Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Privacy at a Glance
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Data Sales</p>
              <p className="font-medium text-success">Never sold</p>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Encryption</p>
              <p className="font-medium text-success">AES-256</p>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Data Access</p>
              <p className="font-medium text-success">You control</p>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Deletion</p>
              <p className="font-medium text-success">On request</p>
            </div>
          </div>
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
        <div className="mt-6 mb-8 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Questions about your privacy? Contact our Data Protection Officer
          </p>
          <p className="text-xs text-primary font-medium">
            privacy@pocketpay.app
          </p>
        </div>
      </div>
    );
  }
);

PrivacyScreen.displayName = 'PrivacyScreen';

export default PrivacyScreen;
