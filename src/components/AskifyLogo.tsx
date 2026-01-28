import { cn } from '@/lib/utils';
import askifyLogoNew from '@/assets/askify-logo-new.png';

interface AskifyLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AskifyLogo({ className, iconOnly = false, size = 'md' }: AskifyLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className={cn('flex items-center', className)}>
      <img 
        src={askifyLogoNew} 
        alt="Askify" 
        className={cn('object-contain', sizeClasses[size])}
      />
    </div>
  );
}
