// Indian Traditional UI Elements Component
import React from 'react';

export const OrnateTopBorder = ({ className = '' }: { className?: string }) => (
  <div className={`relative h-1 bg-gradient-indian-flag ${className}`}>
    <div className="absolute left-1/2 transform -translate-x-1/2 -top-2 w-4 h-4 bg-gradient-spice rounded-full shadow-md" />
  </div>
);

export const OrnateBottomBorder = ({ className = '' }: { className?: string }) => (
  <div className={`relative h-1 bg-gradient-to-r from-transparent via-saffron to-transparent ${className}`}>
    <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2 w-4 h-4 bg-gradient-spice rounded-full shadow-md" />
  </div>
);

export const TraditionalDivider = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-3 my-6 ${className}`}>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/50" />
    <div className="w-2 h-2 rounded-full bg-primary" />
    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/50" />
  </div>
);

export const MandalaShape = ({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
}) => {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  return (
    <div className={`${sizeMap[size]} ${className} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <style>{`
            .mandala-ring { fill: none; stroke: currentColor; stroke-opacity: 0.2; }
            .mandala-ring:hover { stroke-opacity: 0.4; transition: all 0.3s ease; }
          `}</style>
        </defs>
        <circle cx="50" cy="50" r="45" className="mandala-ring" strokeWidth="1" />
        <circle cx="50" cy="50" r="35" className="mandala-ring" strokeWidth="1" />
        <circle cx="50" cy="50" r="25" className="mandala-ring" strokeWidth="1" />
        <circle cx="50" cy="50" r="15" className="mandala-ring" strokeWidth="1" />
        <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
  );
};

export const TraditionalSeparator = ({ 
  variant = 'horizontal',
  className = '' 
}: { 
  variant?: 'horizontal' | 'vertical'; 
  className?: string;
}) => {
  if (variant === 'vertical') {
    return (
      <div className={`w-1 h-12 bg-gradient-to-b from-transparent via-primary to-transparent ${className}`} />
    );
  }

  return (
    <div className={`h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent ${className}`} />
  );
};

export const TraditionalCard = ({
  children,
  className = '',
  highlight = false,
}: {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}) => (
  <div className={`
    rounded-2xl overflow-hidden
    ${highlight 
      ? 'border-2 border-primary bg-gradient-warm shadow-elevated' 
      : 'border border-primary/20 bg-card shadow-card'
    }
    hover:shadow-elevated transition-all duration-300
    ${className}
  `}>
    {children}
  </div>
);

export const TraditionalButton = ({
  children,
  className = '',
  variant = 'primary',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  [key: string]: any;
}) => {
  const variantStyles = {
    primary: 'bg-gradient-spice text-white hover:shadow-elevated',
    secondary: 'bg-secondary text-foreground hover:bg-secondary/80',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5',
  };

  return (
    <button
      className={`
        px-8 py-3 rounded-xl font-medium
        transition-all duration-300
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export const TraditionalBadge = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`
    inline-flex items-center gap-2
    px-4 py-2 rounded-full
    bg-gradient-spice/10 text-primary
    border border-primary/30
    text-xs font-semibold uppercase tracking-wider
    ${className}
  `}>
    {children}
  </div>
);

export default {
  OrnateTopBorder,
  OrnateBottomBorder,
  TraditionalDivider,
  MandalaShape,
  TraditionalSeparator,
  TraditionalCard,
  TraditionalButton,
  TraditionalBadge,
};
