import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, BarChart2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComparisonStore, type ComparisonProduct } from '@/store/comparisonStore';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const BACKEND_URL = 'http://localhost:5001';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${BACKEND_URL}${path}`;
  return path;
};

const truncate = (str: string, max: number): string =>
  str.length > max ? str.slice(0, max) + '…' : str;

// ─── Sub-components ────────────────────────────────────────────────────────────

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i < Math.round(rating)
            ? 'fill-amber-400 text-amber-400'
            : 'fill-gray-100 text-gray-200'
        }`}
      />
    ))}
    <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
  </div>
);

const StockBadge = ({ stock }: { stock: number }) => {
  if (stock === 0)
    return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
  if (stock <= 10)
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-xs">
        Low Stock
      </Badge>
    );
  return (
    <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs">
      In Stock
    </Badge>
  );
};

// ─── Attribute Row ─────────────────────────────────────────────────────────────

interface AttributeRowProps {
  label: string;
  items: ComparisonProduct[];
  render: (p: ComparisonProduct) => React.ReactNode;
}

const AttributeRow = ({ label, items, render }: AttributeRowProps) => (
  <div
    className="grid border-b border-border last:border-0"
    style={{ gridTemplateColumns: `150px repeat(${items.length}, 1fr)` }}
  >
    <div className="py-3 px-3 bg-muted/30 text-xs font-semibold text-muted-foreground flex items-center border-r border-border">
      {label}
    </div>
    {items.map((p) => (
      <div key={p.id} className="py-3 px-3 text-sm flex items-center border-r border-border last:border-0">
        {render(p)}
      </div>
    ))}
  </div>
);

// ─── Collapsed Tray Bar ────────────────────────────────────────────────────────

interface CollapsedBarProps {
  items: ComparisonProduct[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

const CollapsedBar = ({ items, onRemove, onClear, onCompare }: CollapsedBarProps) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-background border-t border-border shadow-lg">
    {/* Product thumbnails */}
    <div className="flex items-center gap-2 flex-1 overflow-x-auto">
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        Compare ({items.length}/4):
      </span>
      {items.map((p) => (
        <div key={p.id} className="relative flex-shrink-0 group">
          <img
            src={getImageUrl(p.image) || 'https://via.placeholder.com/48'}
            alt={p.name}
            className="w-12 h-12 object-cover rounded-md border border-border"
          />
          <button
            type="button"
            onClick={() => onRemove(p.id)}
            aria-label={`Remove ${p.name} from comparison`}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
          >
            <X className="w-2.5 h-2.5" />
          </button>
          <p className="text-xs text-muted-foreground mt-0.5 text-center w-12 truncate">
            {p.name}
          </p>
        </div>
      ))}
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2 flex-shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        aria-label="Clear all products from comparison"
        className="text-xs"
      >
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        Clear all
      </Button>
      <Button
        size="sm"
        onClick={onCompare}
        disabled={items.length < 2}
        aria-label="Open comparison view"
        className="text-xs bg-primary hover:bg-primary/90 text-white"
      >
        <BarChart2 className="w-3.5 h-3.5 mr-1" />
        Compare
      </Button>
    </div>
  </div>
);

// ─── Expanded Comparison View ──────────────────────────────────────────────────

interface ExpandedViewProps {
  items: ComparisonProduct[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const ExpandedView = ({ items, onRemove, onClear, onClose }: ExpandedViewProps) => (
  <div className="flex flex-col bg-background border-t border-border shadow-2xl max-h-[60vh]">
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20 flex-shrink-0">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-primary" />
        <h2 className="font-serif font-bold text-base text-foreground">
          Product Comparison
        </h2>
        <span className="text-sm text-muted-foreground">({items.length} products)</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          aria-label="Clear all products from comparison"
          className="text-xs"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Clear all
        </Button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comparison view"
          className="p-1.5 rounded-md hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Scrollable comparison grid */}
    <div className="overflow-y-auto flex-1">
      {/* Product header row */}
      <div
        className="grid border-b border-border bg-muted/10 sticky top-0 z-10"
        style={{ gridTemplateColumns: `150px repeat(${items.length}, 1fr)` }}
      >
        <div className="py-3 px-3 border-r border-border" />
        {items.map((p) => (
          <div
            key={p.id}
            className="py-3 px-3 flex flex-col items-center gap-2 border-r border-border last:border-0 relative"
          >
            <img
              src={getImageUrl(p.image) || 'https://via.placeholder.com/80'}
              alt={p.name}
              className="w-16 h-16 object-cover rounded-md border border-border"
            />
            <p className="text-xs font-semibold text-foreground text-center leading-tight capitalize line-clamp-2">
              {p.name}
            </p>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              aria-label={`Remove ${p.name} from comparison`}
              className="absolute top-1 right-1 w-5 h-5 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Attribute rows */}
      <AttributeRow
        label="Price"
        items={items}
        render={(p) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">₹{p.price.toFixed(2)}</span>
            {p.originalPrice && p.originalPrice > p.price && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{p.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        )}
      />

      <AttributeRow
        label="Rating"
        items={items}
        render={(p) => <StarRating rating={p.rating} />}
      />

      <AttributeRow
        label="Weight"
        items={items}
        render={(p) => (
          <span className="text-muted-foreground">{p.weight || '—'}</span>
        )}
      />

      <AttributeRow
        label="Category"
        items={items}
        render={(p) => (
          <span className="capitalize text-muted-foreground">{p.category || '—'}</span>
        )}
      />

      <AttributeRow
        label="Stock Status"
        items={items}
        render={(p) => <StockBadge stock={p.stock} />}
      />

      <AttributeRow
        label="Description"
        items={items}
        render={(p) => (
          <span className="text-xs text-muted-foreground leading-relaxed">
            {p.description ? truncate(p.description, 100) : '—'}
          </span>
        )}
      />
    </div>
  </div>
);

// ─── Main ComparisonTray Component ─────────────────────────────────────────────

const ComparisonTray = () => {
  const { items, isOpen, removeProduct, clearAll, setOpen } = useComparisonStore();

  const handleCompare = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleClear = () => clearAll();

  // Don't render at all if no items
  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      role="region"
      aria-label="Product comparison tray"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="expanded"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <ExpandedView
              items={items}
              onRemove={removeProduct}
              onClear={handleClear}
              onClose={handleClose}
            />
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <CollapsedBar
              items={items}
              onRemove={removeProduct}
              onClear={handleClear}
              onCompare={handleCompare}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComparisonTray;
