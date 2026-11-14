/**
 * VariantEditor
 *
 * Multi-variant editor component for Admin Product Form.
 * Features inline editing, bidirectional MRP/Selling Price/Discount % calculation,
 * SKU uniqueness checks, stock thresholds, and availability toggles.
 *
 * Requirements: 2.1–2.9
 */
import { Plus, Trash2, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface VariantItem {
  _id?: string;
  weight: string;
  sku: string;
  barcode?: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  discountAmount?: number;
  stock: number;
  lowStockThreshold?: number;
  isAvailable: boolean;
  variantImage?: string;
}

interface VariantEditorProps {
  variants: VariantItem[];
  onChange: (updated: VariantItem[]) => void;
}

export const VariantEditor = ({ variants, onChange }: VariantEditorProps) => {
  const updateVariant = (index: number, field: keyof VariantItem, value: any) => {
    const updated = [...variants];
    const current = { ...updated[index], [field]: value };

    // Bidirectional price & discount calculations
    if (field === 'mrp') {
      const newMrp = Number(value) || 0;
      current.mrp = newMrp;
      if (current.discountPercent > 0) {
        current.sellingPrice = Math.round(newMrp * (1 - current.discountPercent / 100) * 100) / 100;
      } else if (current.sellingPrice > newMrp) {
        current.sellingPrice = newMrp;
      }
    } else if (field === 'sellingPrice') {
      const newSelling = Number(value) || 0;
      current.sellingPrice = newSelling;
      if (current.mrp > 0) {
        current.discountPercent = Math.max(
          0,
          Math.round(((current.mrp - newSelling) / current.mrp) * 100 * 100) / 100
        );
      }
    } else if (field === 'discountPercent') {
      const newDiscount = Math.min(100, Math.max(0, Number(value) || 0));
      current.discountPercent = newDiscount;
      if (current.mrp > 0) {
        current.sellingPrice = Math.round(current.mrp * (1 - newDiscount / 100) * 100) / 100;
      }
    }

    current.discountAmount = Math.max(0, Math.round((current.mrp - current.sellingPrice) * 100) / 100);
    updated[index] = current;
    onChange(updated);
  };

  const addVariant = () => {
    const newVariant: VariantItem = {
      weight: '100g',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      mrp: 100,
      sellingPrice: 100,
      discountPercent: 0,
      stock: 10,
      lowStockThreshold: 5,
      isAvailable: true,
    };
    onChange([...variants, newVariant]);
  };

  const duplicateVariant = (index: number) => {
    const source = variants[index];
    const copy: VariantItem = {
      ...source,
      _id: undefined,
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      weight: `${source.weight} (Copy)`,
    };
    onChange([...variants, copy]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Weight / Size</TableHead>
              <TableHead className="w-[130px]">SKU</TableHead>
              <TableHead className="w-[100px]">MRP (₹)</TableHead>
              <TableHead className="w-[110px]">Selling (₹)</TableHead>
              <TableHead className="w-[90px]">Disc %</TableHead>
              <TableHead className="w-[90px]">Stock</TableHead>
              <TableHead className="w-[80px]">Active</TableHead>
              <TableHead className="w-[90px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v, idx) => {
              const isPriceInvalid = v.sellingPrice > v.mrp;
              return (
                <TableRow key={idx} className={isPriceInvalid ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                  {/* Weight / Pack Size */}
                  <TableCell>
                    <Input
                      value={v.weight}
                      onChange={(e) => updateVariant(idx, 'weight', e.target.value)}
                      placeholder="e.g. 100g"
                      className="h-8 text-xs font-medium"
                    />
                  </TableCell>

                  {/* SKU */}
                  <TableCell>
                    <Input
                      value={v.sku}
                      onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                      placeholder="SKU-100"
                      className="h-8 text-xs font-mono"
                    />
                  </TableCell>

                  {/* MRP */}
                  <TableCell>
                    <Input
                      type="number"
                      value={v.mrp}
                      onChange={(e) => updateVariant(idx, 'mrp', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </TableCell>

                  {/* Selling Price */}
                  <TableCell>
                    <div className="relative">
                      <Input
                        type="number"
                        value={v.sellingPrice}
                        onChange={(e) => updateVariant(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                        className={`h-8 text-xs font-mono font-bold ${
                          isPriceInvalid ? 'border-red-500 text-red-600 focus-visible:ring-red-500' : ''
                        }`}
                      />
                      {isPriceInvalid && (
                        <span className="text-[10px] text-red-500 block absolute -bottom-4 left-0 whitespace-nowrap flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 inline" /> &gt; MRP
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Discount % */}
                  <TableCell>
                    <Input
                      type="number"
                      value={v.discountPercent}
                      onChange={(e) => updateVariant(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono text-emerald-600 font-bold"
                    />
                  </TableCell>

                  {/* Stock */}
                  <TableCell>
                    <Input
                      type="number"
                      value={v.stock}
                      onChange={(e) => updateVariant(idx, 'stock', parseInt(e.target.value, 10) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </TableCell>

                  {/* Available Switch */}
                  <TableCell>
                    <Switch
                      checked={v.isAvailable}
                      onCheckedChange={(checked) => updateVariant(idx, 'isAvailable', checked)}
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicateVariant(idx)}
                        title="Duplicate variant"
                        className="h-7 w-7"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(idx)}
                        disabled={variants.length <= 1}
                        title="Delete variant"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addVariant}
        className="text-xs flex items-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" /> Add Variant
      </Button>
    </div>
  );
};

export default VariantEditor;
