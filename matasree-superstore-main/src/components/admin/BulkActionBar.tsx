/**
 * BulkActionBar
 *
 * Sticky bottom toolbar for performing bulk actions on selected products.
 * Supports bulk status change, discount application, price adjustment, inventory delta,
 * and bulk deletion with confirmation dialog.
 *
 * Requirements: 12.1–12.4
 */
import { useState } from 'react';
import { Trash2, Tag, Percent, Layers, Box, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export const BulkActionBar = ({
  selectedIds,
  onClearSelection,
  onSuccess,
}: BulkActionBarProps) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleExecuteBulkAction = async (actionType: string, payloadData?: any) => {
    setLoading(true);
    try {
      const response: any = await apiClient.adminBulkOperation({
        productIds: selectedIds,
        action: actionType,
        payload: payloadData,
      });

      const res = response?.data ?? response;
      toast.success(
        `Bulk ${actionType} complete! Modified ${res?.modified ?? selectedIds.length} product(s).`
      );

      setActiveAction(null);
      setInputValue('');
      onClearSelection();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk operation failed');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const submitCustomAction = () => {
    if (!activeAction) return;

    if (activeAction === 'discount') {
      const discount = parseFloat(inputValue);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        toast.error('Enter a valid discount percentage (0-100)');
        return;
      }
      handleExecuteBulkAction('discount', { discountPercent: discount });
    } else if (activeAction === 'price') {
      const price = parseFloat(inputValue);
      if (isNaN(price) || price < 0) {
        toast.error('Enter a valid price');
        return;
      }
      handleExecuteBulkAction('price', { sellingPrice: price });
    } else if (activeAction === 'inventory') {
      const delta = parseInt(inputValue, 10);
      if (isNaN(delta)) {
        toast.error('Enter a valid stock adjustment quantity (e.g. +10 or -5)');
        return;
      }
      handleExecuteBulkAction('inventory', { deltaQuantity: delta, reason: 'bulk_admin_adjustment' });
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl bg-card border border-border shadow-2xl rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold font-mono">
            {selectedIds.length} Selected
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <Select onValueChange={(status) => handleExecuteBulkAction('status', { status })}>
            <SelectTrigger className="h-8 text-xs w-[130px]">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Quick Action Input Panel */}
          {activeAction ? (
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg border border-border">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  activeAction === 'discount' ? 'Disc % (e.g. 15)' :
                  activeAction === 'price' ? 'New Price (₹)' :
                  'Stock Delta (+10 / -5)'
                }
                className="h-7 w-32 text-xs bg-background"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && submitCustomAction()}
              />
              <Button type="button" size="icon" onClick={submitCustomAction} disabled={loading} className="h-7 w-7">
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setActiveAction(null)} className="h-7 w-7">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setActiveAction('discount'); setInputValue(''); }}
                className="h-8 text-xs gap-1"
              >
                <Percent className="w-3.5 h-3.5 text-amber-500" /> Apply Disc %
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setActiveAction('price'); setInputValue(''); }}
                className="h-8 text-xs gap-1"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-500" /> Set Price
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setActiveAction('inventory'); setInputValue(''); }}
                className="h-8 text-xs gap-1"
              >
                <Box className="w-3.5 h-3.5 text-blue-500" /> Adjust Stock
              </Button>
            </>
          )}

          {/* Bulk Delete */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-8 text-xs gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete {selectedIds.length} product(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Selected products and their variants will be permanently removed from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleExecuteBulkAction('delete')}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Deleting...' : 'Delete Products'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkActionBar;
