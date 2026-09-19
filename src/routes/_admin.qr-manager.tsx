import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download, Plus, Trash2, ExternalLink, Printer, Sparkles, Copy, Check, X, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/qr-manager")({
  component: QrManagerPage,
});

interface QrItem {
  id: string;
  store_id: string;
  type: string;
  label: string;
  target_url: string;
  image_path: string;
  scan_count: number;
  created_at: string;
}

function QrManagerPage() {
  const queryClient = useQueryClient();
  const { data: store } = useMyStore();
  const storeId = store?.id;

  const [qrType, setQrType] = useState<string>("table");
  const [label, setLabel] = useState<string>("");
  const [tableNumber, setTableNumber] = useState<string>("T-01");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const baseUrl = store?.slug
    ? `${window.location.origin}/s/${store.slug}`
    : window.location.origin;

  const { data: qrList = [], isLoading } = useQuery({
    queryKey: ["qr-codes", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/qr/${storeId}`);
      return res.data.data as QrItem[];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      let finalTargetUrl = baseUrl;
      let finalLabel = label || `${qrType.toUpperCase()} QR`;

      if (qrType === "table") {
        finalTargetUrl = `${baseUrl}?table=${encodeURIComponent(tableNumber)}`;
        finalLabel = label || `Table ${tableNumber}`;
      } else if (qrType === "menu") {
        finalTargetUrl = baseUrl;
        finalLabel = label || "Store Menu Poster";
      }

      const res = await api.post(`/qr/${storeId}/generate`, {
        type: qrType,
        label: finalLabel,
        target_url: finalTargetUrl,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("QR Code generated successfully!");
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["qr-codes", storeId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to generate QR code");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/qr/${storeId}/${id}`);
    },
    onSuccess: () => {
      toast.success("QR code deleted");
      queryClient.invalidateQueries({ queryKey: ["qr-codes", storeId] });
    },
  });

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Target URL copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const { data: previewQr, isLoading: previewLoading } = useQuery({
    queryKey: ["qr-code", storeId, previewId],
    enabled: !!storeId && !!previewId,
    queryFn: async () => {
      const res = await api.get(`/qr/${storeId}/${previewId}`);
      return res.data.data as QrItem;
    },
  });

  const currentPreviewUrl = qrType === "table"
    ? `${baseUrl}?table=${tableNumber}`
    : baseUrl;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-adaptive p-6 rounded-2xl border border-white/20 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-adaptive flex items-center gap-2">
            <QrCode className="w-7 h-7 text-[#190E85] dark:text-[#00E0FF]" />
            QR Code Management Engine
          </h1>
          <p className="text-sm text-adaptive-muted mt-1">
            Generate scannable, high-resolution QR codes for dine-in tables, storefront posters, and marketing campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-adaptive text-adaptive hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Sheet
          </button>
        </div>
      </div>

      {/* Generator & Preview Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Form */}
        <div className="lg:col-span-2 glass-adaptive p-6 rounded-2xl border border-white/20 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-adaptive flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Generate New QR Code
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-adaptive-muted uppercase tracking-wider mb-2">
                QR Type
              </label>
              <select
                value={qrType}
                onChange={(e) => setQrType(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm text-adaptive border focus:ring-2 focus:ring-[#190E85]"
              >
                <option value="table">Table Ordering (Dine-in)</option>
                <option value="menu">General Store Menu</option>
                <option value="promo">Promo Discount Link</option>
              </select>
            </div>

            {qrType === "table" ? (
              <div>
                <label className="block text-xs font-semibold text-adaptive-muted uppercase tracking-wider mb-2">
                  Table Label / Number
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T-04"
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm text-adaptive border focus:ring-2 focus:ring-[#190E85]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-adaptive-muted uppercase tracking-wider mb-2">
                  Custom Label
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Front Window Poster"
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm text-adaptive border focus:ring-2 focus:ring-[#190E85]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-adaptive-muted uppercase tracking-wider mb-1">
              Target Encoded URL Preview
            </label>
            <p className="text-xs font-mono text-adaptive-muted bg-black/5 dark:bg-white/5 p-2.5 rounded-lg break-all">
              {currentPreviewUrl}
            </p>
          </div>

          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#190E85] hover:bg-[#190E85]/90 text-white font-medium text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {generateMutation.isPending ? "Generating PNG..." : "Generate & Save QR Code"}
          </button>
        </div>

        {/* Live Vector SVG Preview */}
        <div className="glass-adaptive p-6 rounded-2xl border border-white/20 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-semibold text-adaptive-muted uppercase tracking-wider">
            Live High-Res Preview
          </span>

          <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200">
            <QRCodeSVG value={currentPreviewUrl} size={160} fgColor="#190E85" level="H" />
          </div>

          <div className="text-xs text-adaptive-muted space-y-1">
            <p className="font-semibold text-adaptive">
              {qrType === "table" ? `Table ${tableNumber}` : label || "Store QR"}
            </p>
            <p>Scan with phone camera to test</p>
          </div>
        </div>
      </div>

      {/* Generated QR List */}
      <div className="glass-adaptive p-6 rounded-2xl border border-white/20 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-adaptive">
          Active Generated QR Codes ({qrList.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-adaptive-muted text-sm animate-pulse">
            Loading QR code library...
          </div>
        ) : qrList.length === 0 ? (
          <div className="py-12 text-center text-adaptive-muted text-sm">
            No QR codes generated yet. Use the panel above to generate your first table QR code.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrList.map((qr) => (
              <div
                key={qr.id}
                className="p-4 rounded-xl border border-adaptive bg-white/40 dark:bg-white/5 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                    <QRCodeSVG value={qr.target_url} size={64} fgColor="#190E85" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-adaptive truncate">{qr.label}</h3>
                    <p className="text-xs text-adaptive-muted capitalize mt-0.5">Type: {qr.type}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {qr.scan_count} Scans
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-adaptive flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(qr.target_url, qr.id)}
                      className="p-2 text-xs font-medium text-adaptive hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition flex items-center gap-1"
                    >
                      {copiedId === qr.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy URL
                    </button>
                    <button
                      onClick={() => setPreviewId(qr.id)}
                      className="p-2 text-xs font-medium text-adaptive hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate(qr.id)}
                    className="p-2 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl glass-adaptive-strong p-6 space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-adaptive">QR Preview</h3>
              <button onClick={() => setPreviewId(null)} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            {previewLoading ? (
              <div className="py-8 text-adaptive-muted text-sm">Loading QR details...</div>
            ) : previewQr ? (
              <>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block">
                  <QRCodeSVG value={previewQr.target_url} size={200} fgColor="#190E85" level="H" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-adaptive">{previewQr.label}</p>
                  <p className="text-xs text-adaptive-muted capitalize">{previewQr.type}</p>
                  <p className="text-xs font-mono text-adaptive-muted break-all bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                    {previewQr.target_url}
                  </p>
                  <p className="text-xs text-adaptive-muted">{previewQr.scan_count} scans</p>
                </div>
              </>
            ) : (
              <div className="py-8 text-red-500 text-sm">QR code not found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
