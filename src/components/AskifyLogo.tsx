import { cn } from '@/lib/utils';

interface AskifyLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AskifyLogo({ className, iconOnly = false, size = 'md' }: AskifyLogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-xl' },
    lg: { icon: 'h-10 w-10', text: 'text-2xl' },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Professional Icon */}
      <div className={cn(
        'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg',
        sizeClasses[size].icon
      )}>
        {/* Abstract "A" shape with modern design */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[60%] w-[60%]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main A shape */}
          <path
            d="M12 3L4 21h3.5l1.5-4h6l1.5 4H20L12 3zm0 6l2.25 6h-4.5L12 9z"
            fill="currentColor"
            className="text-primary-foreground"
          />
          {/* Spark accent */}
          <circle
            cx="18"
            cy="6"
            r="2"
            fill="currentColor"
            className="text-primary-foreground/80"
          />
        </svg>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
      </div>
      
      {/* Wordmark */}
      {!iconOnly && (
        <span className={cn(
          'font-bold tracking-wider bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent',
          sizeClasses[size].text
        )}>
          ASKIFY
        </span>
      )}
    </div>
  );
}
