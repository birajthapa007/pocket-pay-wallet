import React from 'react';
import { ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'protected' | 'verified';

interface SecurityBadgeProps {
  variant?: BadgeVariant;
  message?: string;
  className?: string;
}

const SecurityBadge: React.FC<SecurityBadgeProps> = ({ 
  variant = 'default', 
  message,
  className 
}) => {
  const configs = {
    default: {
      icon: ShieldCheck,
      text: message || 'Protected by Pocket Pay',
      bgClass: 'bg-primary-soft',
      textClass: 'text-primary',
      iconClass: 'text-primary',
    },
    success: {
      icon: ShieldCheck,
      text: message || 'Secure transaction complete',
      bgClass: 'bg-success-soft',
      textClass: 'text-success',
      iconClass: 'text-success',
    },
    protected: {
      icon: Lock,
      text: message || 'Your money is protected',
      bgClass: 'bg-info-soft',
      textClass: 'text-info',
      iconClass: 'text-info',
    },
    verified: {
      icon: Sparkles,
      text: message || 'AI-verified secure',
      bgClass: 'bg-primary-soft',
      textClass: 'text-primary',
      iconClass: 'text-primary',
    },
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 py-2 px-3 rounded-full",
      config.bgClass,
      className
    )}>
      <Icon className={cn("w-4 h-4", config.iconClass)} />
      <span className={cn("text-xs font-medium", config.textClass)}>
        {config.text}
      </span>
    </div>
  );
};

export default SecurityBadge;
