/**
 * SerpPreview
 *
 * Real-time Google Search Result SERP Preview component.
 * Displays title, URL, and snippet preview with character length counters.
 *
 * Requirements: 6.4, 6.5, 6.6
 */
import { Badge } from '@/components/ui/badge';

interface SerpPreviewProps {
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  productName?: string;
  productDescription?: string;
  siteDomain?: string;
}

export const CharCount = ({ current, max }: { current: number; max: number }) => {
  const isOver = current > max;
  return (
    <span
      className={`text-[11px] font-mono font-medium ${
        isOver ? 'text-red-500 font-bold' : current > max - 10 ? 'text-amber-500' : 'text-muted-foreground'
      }`}
    >
      {current}/{max} {isOver ? '(Truncated by Google)' : ''}
    </span>
  );
};

export const SerpPreview = ({
  seoTitle,
  seoDescription,
  slug = 'product-slug',
  productName = 'Product Name',
  productDescription = 'Product description snippet...',
  siteDomain = 'matasreesuper.com',
}: SerpPreviewProps) => {
  const title = (seoTitle || productName).trim();
  const description = (seoDescription || productDescription).trim();
  const displayUrl = `https://${siteDomain} › products › ${slug || 'sample-product'}`;

  const truncatedTitle = title.length > 60 ? `${title.slice(0, 57)}...` : title;
  const truncatedDescription = description.length > 160 ? `${description.slice(0, 157)}...` : description;

  return (
    <div className="space-y-3 rounded-xl border border-border p-4 bg-card shadow-sm">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Google Search SERP Preview
        </Badge>
        <div className="flex items-center gap-3">
          <CharCount current={title.length} max={60} />
          <span className="text-muted-foreground/30">|</span>
          <CharCount current={description.length} max={160} />
        </div>
      </div>

      <div className="rounded-lg bg-background p-3.5 border border-border/60 space-y-1 font-sans">
        {/* URL Line */}
        <div className="text-[12px] text-emerald-700 dark:text-emerald-400 truncate font-mono">
          {displayUrl}
        </div>

        {/* Title Line */}
        <h3 className="text-base text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer leading-snug truncate">
          {truncatedTitle || 'Untitled Product — Matasree Super Spices'}
        </h3>

        {/* Description Snippet */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {truncatedDescription || 'Buy authentic Indian spices and masala online from Matasree Super Spices. 100% natural, stone-ground aroma.'}
        </p>
      </div>
    </div>
  );
};

export default SerpPreview;
