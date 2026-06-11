import { ShieldCheck, Truck, BadgeCheck, RotateCcw } from 'lucide-react';

interface TrustBadgesProps {
  className?: string;
}

const badges = [
  {
    icon: ShieldCheck,
    label: 'Secure Payment',
  },
  {
    icon: Truck,
    label: 'Free Delivery on orders ₹499+',
  },
  {
    icon: BadgeCheck,
    label: '100% Natural Quality',
  },
  {
    icon: RotateCcw,
    label: 'Easy 7-Day Returns',
  },
];

const TrustBadges = ({ className }: TrustBadgesProps) => {
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ''}`}>
      {badges.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
