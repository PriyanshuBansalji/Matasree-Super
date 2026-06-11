import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Tag, Copy, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Constants ─────────────────────────────────────────────────────────────────

const SESSION_FLAG = 'matasree-exit-intent-shown';
const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes in milliseconds
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Format milliseconds remaining into MM:SS display */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExitIntentModalProps {
  /** Whether the exit intent detection is active. Should be true only when
   *  cart is non-empty AND order has not been placed. */
  active: boolean;
  /** Discount code shown to the user. Defaults to "EXIT10". */
  discountCode?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ExitIntentModal = ({
  active,
  discountCode = 'EXIT10',
}: ExitIntentModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(EXPIRY_MS);
  const [copied, setCopied] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Exit intent detection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when pointer moves toward top edge (toward browser chrome)
      if (e.clientY >= 10) return;

      // Check sessionStorage: show only once per session
      if (sessionStorage.getItem(SESSION_FLAG)) return;

      // Mark as shown for this session immediately to prevent double-trigger
      sessionStorage.setItem(SESSION_FLAG, '1');

      // Compute expiry timestamp (30 minutes from now)
      const expiry = Date.now() + EXPIRY_MS;
      setExpiresAt(expiry);
      setTimeRemaining(EXPIRY_MS);
      setIsOpen(true);
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [active]);

  // ── Countdown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || expiresAt === null) return;

    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeRemaining(0);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, expiresAt]);

  // ── Focus management ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Save the element that had focus before we opened
    previousFocusRef.current = document.activeElement;

    // Focus first focusable element inside dialog after paint
    const raf = requestAnimationFrame(() => {
      const el = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
      el?.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // ── Close handler ─────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Restore focus after the modal has unmounted
    setTimeout(() => {
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    }, 0);
  }, []);

  // ── Keyboard handler (Escape + Tab trap) ─────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        const container = dialogRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        ).filter((el) => !el.closest('[aria-hidden="true"]'));

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [handleClose]
  );

  // ── Copy to clipboard ────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      toast.success('Discount code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = discountCode;
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      toast.success('Discount code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [discountCode]);

  const isExpired = timeRemaining <= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-hidden={!isOpen}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-intent-title"
            aria-describedby="exit-intent-desc"
            className="relative z-10 w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden border border-border"
            initial={{ opacity: 0, scale: 0.92, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            {/* Close button */}
            <button
              type="button"
              aria-label="Close offer"
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/80 hover:bg-secondary border border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            {/* Decorative gradient header */}
            <div className="bg-gradient-spice px-6 pt-8 pb-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-3">
                <Tag className="w-7 h-7 text-white" />
              </div>
              <h2
                id="exit-intent-title"
                className="font-serif text-2xl font-bold text-white mb-1"
              >
                Wait! Don't leave yet 🎁
              </h2>
              <p
                id="exit-intent-desc"
                className="text-white/90 text-sm leading-relaxed"
              >
                Here's an exclusive discount just for you. Use the code below
                at checkout and save on your order!
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-5">
              {/* Discount code display */}
              <div className="bg-secondary/40 border-2 border-dashed border-primary/40 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                  Your exclusive code
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono font-bold text-2xl tracking-[0.2em] text-foreground select-all">
                    {discountCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? 'Code copied' : 'Copy discount code'}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Countdown timer */}
              <div
                className={`flex items-center justify-center gap-2 text-sm font-medium ${
                  isExpired
                    ? 'text-destructive'
                    : timeRemaining < 5 * 60 * 1000
                    ? 'text-amber-600'
                    : 'text-muted-foreground'
                }`}
                aria-live="polite"
                aria-atomic="true"
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                {isExpired ? (
                  <span>This offer has expired</span>
                ) : (
                  <span>
                    Offer expires in{' '}
                    <strong className="font-mono tabular-nums">
                      {formatTimeRemaining(timeRemaining)}
                    </strong>
                  </span>
                )}
              </div>

              {/* CTA buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={handleCopy}
                  disabled={isExpired}
                  className="w-full bg-gradient-spice hover:opacity-90 text-white font-bold py-5 rounded-xl shadow-md transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Code Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code & Continue Shopping
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  No thanks, I'll pay full price
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentModal;
