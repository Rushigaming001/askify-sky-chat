import { cn } from '@/lib/utils';
import askifyIcon from '@/assets/askify-icon.jpg';
import askifyLogoFull from '@/assets/askify-logo-full.jpg';

interface AskifyLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AskifyLogo({ className, iconOnly = false, size = 'md' }: AskifyLogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'h-5' },
    md: { icon: 'h-8 w-8', text: 'h-6' },
    lg: { icon: 'h-10 w-10', text: 'h-8' },
  };

  if (iconOnly) {
    return (
      <div className={cn('flex items-center', className)}>
        <img 
          src={askifyIcon} 
          alt="Askify" 
          className={cn('object-contain rounded-lg', sizeClasses[size].icon)}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <img 
        src={askifyLogoFull} 
        alt="Askify" 
        className={cn('object-contain', size === 'sm' ? 'h-6' : size === 'md' ? 'h-8' : 'h-10')}
      />
    </div>
  );
}
