/**
 * ImportExportPanel
 *
 * CSV/XLSX export and bulk product import component for Admin Products page.
 * Displays result modal with detailed per-row error reporting on import complete.
 *
 * Requirements: 12.5–12.8
 */
import { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';

interface ImportExportPanelProps {
  onRefetch: () => void;
}

export const ImportExportPanel = ({ onRefetch }: ImportExportPanelProps) => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resultSheetOpen, setResultSheetOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response: any = await apiClient.adminExportProducts();
      const blob = new Blob([response.data || response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `matasree_products_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Product catalog exported as CSV');
    } catch (err: any) {
      toast.error('Failed to export catalog');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.error('CSV file is empty or missing data rows');
        setImporting(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const products: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        if (values.length < 3) continue;

        products.push({
          name: values[1] || values[0],
          category: values[2] || 'Spices',
          brand: values[3] || 'Matasree',
          price: parseFloat(values[9] || values[8] || '100') || 100,
          mrp: parseFloat(values[8] || '100') || 100,
          stock: parseInt(values[10] || '10', 10) || 10,
          sku: values[6] || `SKU-IMP-${i}`,
          weight: values[7] || '100g',
        });
      }

      const response: any = await apiClient.adminImportProducts({ products });
      const data = response?.data ?? response;

      setImportResult(data);
      setResultSheetOpen(true);
      toast.success(`Import complete! ${data.created || 0} created, ${data.updated || 0} updated.`);
      onRefetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed. Check file format.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={exporting}
        className="text-xs gap-1.5"
      >
        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-primary" />}
        Export CSV
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="text-xs gap-1.5"
      >
        {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-emerald-500" />}
        Import CSV
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Import Result Summary Sheet */}
      <Sheet open={resultSheetOpen} onOpenChange={setResultSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> Product Import Summary
            </SheetTitle>
            <SheetDescription>
              Results of bulk product catalog processing.
            </SheetDescription>
          </SheetHeader>

          {importResult && (
            <div className="space-y-6 pt-6">
              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 p-3 rounded-xl text-center">
                  <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                    {importResult.created || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">New Created</span>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 p-3 rounded-xl text-center">
                  <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 block">
                    {importResult.updated || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">Updated</span>
                </div>

                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 p-3 rounded-xl text-center">
                  <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 block">
                    {importResult.failed || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">Failed</span>
                </div>
              </div>

              {/* Error List */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Row Errors ({importResult.errors.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto border border-border rounded-xl divide-y divide-border text-xs font-mono">
                    {importResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex items-start gap-2 bg-muted/20">
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Row {err.row}
                        </span>
                        <span className="text-muted-foreground">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => setResultSheetOpen(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ImportExportPanel;
