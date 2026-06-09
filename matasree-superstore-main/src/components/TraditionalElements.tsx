// Indian Traditional UI Elements Component
import React from 'react';

export const OrnateTopBorder = ({ className = '' }: { className?: string }) => (
  <div className={`relative h-1.5 bg-gradient-indian-flag ${className}`}>
    <div className="absolute left-1/2 transform -translate-x-1/2 -top-2.5 w-4 h-4 bg-gradient-spice rounded-full shadow-md border-2 border-white" />
    <div className="absolute inset-0 opacity-30 spice-pattern" />
  </div>
);

export const OrnateBottomBorder = ({ className = '' }: { className?: string }) => (
  <div className={`relative h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent ${className}`}>
    <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2.5 w-4 h-4 bg-gradient-spice rounded-full shadow-md border-2 border-white" />
    <div className="absolute inset-0 opacity-20 spice-pattern" />
  </div>
);

export const TraditionalDivider = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-4 my-8 ${className}`}>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
    <div className="relative">
      <div className="w-3 h-3 rounded-full bg-primary shadow-md" />
      <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary animate-ping" style={{ animationDuration: '2s' }} />
    </div>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/60 to-transparent" />
  </div>
);

export const MandalaShape = ({ 
  size = 'md',
  className = '',
  animated = false 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
  animated?: boolean;
}) => {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  return (
    <div className={`${sizeMap[size]} ${className} relative ${animated ? 'animate-rotate-slow' : ''}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <defs>
          <style>{`
            .mandala-ring { fill: none; stroke: currentColor; stroke-opacity: 0.3; }
            .mandala-petal { stroke: currentColor; stroke-opacity: 0.4; fill: none; }
            .mandala-ring:hover { stroke-opacity: 0.6; transition: all 0.4s ease; }
          `}</style>
        </defs>
        {/* Outer rings */}
        <circle cx="50" cy="50" r="48" className="mandala-ring" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="42" className="mandala-ring" strokeWidth="1" />
        <circle cx="50" cy="50" r="36" className="mandala-ring" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="30" className="mandala-ring" strokeWidth="1" />
        <circle cx="50" cy="50" r="24" className="mandala-ring" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="18" className="mandala-ring" strokeWidth="1" />
        <circle cx="50" cy="50" r="12" className="mandala-ring" strokeWidth="1" />
        
        {/* Petals */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 38 * Math.cos(rad);
          const y = 50 + 38 * Math.sin(rad);
          return <circle key={angle} cx={x} cy={y} r="3" fill="currentColor" opacity="0.5" />;
        })}
        
        {/* Center gem */}
        <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.6" />
        <circle cx="50" cy="50" r="3" fill="currentColor" opacity="1" />
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
    <div className={`w-12 h-1 bg-gradient-to-r from-transparent via-primary to-transparent ${className}`} />
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
    rounded-2xl overflow-hidden relative group
    ${highlight 
      ? 'border-2 border-primary bg-gradient-warm shadow-elevated' 
      : 'border-2 border-primary/30 bg-card shadow-card hover:border-primary/60'
    }
    hover:shadow-elevated transition-all duration-300
    ${className}
  `}>
    {/* Decorative ornate corner element - top left */}
    {highlight && (
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-br-lg opacity-60 group-hover:opacity-100 transition-opacity" />
    )}
    {highlight && (
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-tl-lg opacity-60 group-hover:opacity-100 transition-opacity" />
    )}
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
    primary: 'bg-primary text-white hover:scale-105 border border-primary/50',
    secondary: 'bg-secondary text-foreground hover:bg-secondary/80 border border-secondary/60 hover:border-primary',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 hover:shadow-md',
  };

  return (
    <button
      className={`
        px-8 py-3 rounded-xl font-bold tracking-wide
        transition-all duration-300 relative overflow-hidden
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transition-opacity translate-x-[-100%] hover:translate-x-[100%]" />
    </button>
  );
};

export const TraditionalBadge = ({
  children,
  className = '',
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'accent';
}) => {
  const variantStyles = {
    default: 'bg-primary/10 text-primary border-primary/40',
    premium: 'bg-gradient-spice/15 text-orange-800 border-orange-400/50 shadow-md',
    accent: 'bg-accent/10 text-accent border-accent/50 shadow-sm',
  };

  return (
    <div className={`
      inline-flex items-center gap-2
      px-5 py-2.5 rounded-full
      border-2
      text-xs font-bold uppercase tracking-widest
      transition-all duration-300 hover:shadow-md
      ${variantStyles[variant]}
      ${className}
    `}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {children}
    </div>
  );
};

export const TraditionalPill = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`
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
