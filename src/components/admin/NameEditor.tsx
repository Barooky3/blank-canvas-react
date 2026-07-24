import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  saveProductNameOverride,
  useProductNameOverride,
} from '@/hooks/useProductName';

interface NameEditorProps {
  productId: string;
  originalName: string;
  variant?: 'card' | 'detail';
}

export const NameEditor = ({ productId, originalName, variant = 'card' }: NameEditorProps) => {
  const override = useProductNameOverride(productId);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(override || originalName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(override || originalName);
  }, [open, override, originalName]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isDetail = variant === 'detail';

  const handleSave = async () => {
    setSaving(true);
    await saveProductNameOverride(productId, value);
    setSaving(false);
    setOpen(false);
  };

  const handleReset = async () => {
    setSaving(true);
    await saveProductNameOverride(productId, '');
    setSaving(false);
    setOpen(false);
  };

  const stopAll = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerBtn = (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={`absolute ${
        isDetail ? 'top-4 right-16 w-9 h-9' : 'top-2 right-10 w-7 h-7'
      } z-50 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors`}
      title="Rename product"
    >
      <Pencil className={isDetail ? 'w-4 h-4' : 'w-3 h-3'} />
    </button>
  );

  if (!open) return triggerBtn;

  const panel = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => {
        stopAll(e);
        setOpen(false);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-[360px] max-w-[calc(100vw-2rem)] bg-neutral-900 border border-white/15 rounded-lg shadow-2xl p-5 flex flex-col gap-4"
        onClick={stopAll}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 text-white/70 hover:text-white p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-6">
          <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Rename product</p>
          <p className="text-[11px] text-white/40 truncate">Original: {originalName}</p>
        </div>

        <div>
          <label className="text-[11px] text-white/70 mb-1.5 block">Display name</label>
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-800 border-white/20 text-white"
            placeholder="Enter new name"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            disabled={saving || !override}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
            title="Reset to original name"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-white/70 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !value.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {triggerBtn}
      {typeof document !== 'undefined' && createPortal(panel, document.body)}
    </>
  );
};
