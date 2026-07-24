import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize, X, ZoomIn, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useProductPadding, savePaddingOverride, PaddingOverride } from '@/hooks/useProductPadding';

interface PaddingAdjusterProps {
  productId: string;
  productName: string;
  variant?: 'card' | 'detail';
}

const STEP = 0.25;

type Side = 'padding_top' | 'padding_right' | 'padding_bottom' | 'padding_left';

const sides: { key: Side; label: string; icon: typeof ChevronUp }[] = [
  { key: 'padding_top', label: 'Top', icon: ChevronUp },
  { key: 'padding_right', label: 'Right', icon: ChevronRight },
  { key: 'padding_bottom', label: 'Bottom', icon: ChevronDown },
  { key: 'padding_left', label: 'Left', icon: ChevronLeft },
];

export const PaddingAdjuster = ({ productId, productName, variant = 'card' }: PaddingAdjusterProps) => {
  const override = useProductPadding(productId);
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<PaddingOverride>({
    padding_top: 0, padding_right: 0, padding_bottom: 0, padding_left: 0, scale: 1,
  });

  useEffect(() => {
    if (override) setLocal(override);
  }, [override]);

  // Lock background scroll while panel is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const updateAndSave = (next: PaddingOverride) => {
    setLocal(next);
    savePaddingOverride(productId, next);
  };

  const adjust = (side: Side | 'all', delta: number) => {
    const next = { ...local };
    if (side === 'all') {
      next.padding_top = +(next.padding_top + delta).toFixed(2);
      next.padding_right = +(next.padding_right + delta).toFixed(2);
      next.padding_bottom = +(next.padding_bottom + delta).toFixed(2);
      next.padding_left = +(next.padding_left + delta).toFixed(2);
    } else {
      next[side] = +(next[side] + delta).toFixed(2);
    }
    updateAndSave(next);
  };

  const handleInputChange = (side: Side, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    updateAndSave({ ...local, [side]: +num.toFixed(2) });
  };

  const handleAllInputChange = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const val = +num.toFixed(2);
    updateAndSave({ ...local, padding_top: val, padding_right: val, padding_bottom: val, padding_left: val });
  };

  const handleScaleChange = (values: number[]) => {
    updateAndSave({ ...local, scale: +values[0].toFixed(2) });
  };

  const handleScaleInput = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    updateAndSave({ ...local, scale: Math.max(0.1, +num.toFixed(2)) });
  };

  const isDetail = variant === 'detail';

  const stopAll = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerBtn = (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={`absolute ${isDetail ? 'top-4 right-4 w-9 h-9' : 'top-2 right-2 w-7 h-7'} z-50 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors`}
      title="Adjust padding & scale"
    >
      <Move className={isDetail ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
    </button>
  );

  if (!open) return triggerBtn;

  // Identical panel on every device: fixed-size centered modal via portal.
  const panel = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => { stopAll(e); setOpen(false); }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-[320px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto bg-neutral-900 border border-white/15 rounded-lg shadow-2xl p-4 flex flex-col gap-3"
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

        <div className="flex items-center justify-between gap-3 pr-6">
          <p className="text-xs text-white/90 font-medium truncate">{productName}</p>
          <button
            onClick={() => updateAndSave({ padding_top: 0, padding_right: 0, padding_bottom: 0, padding_left: 0, scale: 1 })}
            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors shrink-0"
            title="Reset all"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Scale slider */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-1.5">
            <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-blue-400 font-medium flex-1">Scale</span>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="5"
              value={local.scale}
              onChange={(e) => handleScaleInput(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent border border-blue-400/50 text-white text-center font-mono rounded focus:outline-none focus:border-blue-400 w-16 h-7 text-xs"
            />
          </div>
          <Slider
            value={[local.scale]}
            onValueChange={handleScaleChange}
            min={0.1}
            max={3}
            step={0.05}
            className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-blue-400"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-white/40">0.1x</span>
            <span className="text-[9px] text-white/40">1x</span>
            <span className="text-[9px] text-white/40">3x</span>
          </div>
        </div>

        <div className="w-full h-px bg-white/10" />

        {/* All padding control */}
        <Row
          icon={<Maximize className="w-3.5 h-3.5 text-white/70" />}
          label="All"
          value={local.padding_top === local.padding_right && local.padding_right === local.padding_bottom && local.padding_bottom === local.padding_left ? String(local.padding_top) : ''}
          placeholder="—"
          onMinus={() => adjust('all', -STEP)}
          onPlus={() => adjust('all', STEP)}
          onChange={handleAllInputChange}
        />

        {sides.map(({ key, label, icon: Icon }) => (
          <Row
            key={key}
            icon={<Icon className="w-3.5 h-3.5 text-white/70" />}
            label={label}
            value={String(local[key])}
            onMinus={() => adjust(key, -STEP)}
            onPlus={() => adjust(key, STEP)}
            onChange={(v) => handleInputChange(key, v)}
          />
        ))}
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

interface RowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder?: string;
  onMinus: () => void;
  onPlus: () => void;
  onChange: (v: string) => void;
}

const Row = ({ icon, label, value, placeholder, onMinus, onPlus, onChange }: RowProps) => (
  <div className="flex items-center gap-2">
    <Button
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0 text-white hover:bg-white/20 shrink-0"
      onClick={onMinus}
    >
      <Minus className="w-3.5 h-3.5" />
    </Button>
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      {icon}
      <span className="text-[11px] text-white/70 w-12">{label}</span>
      <input
        type="number"
        step="0.25"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="bg-transparent border border-white/30 text-white text-center font-mono rounded focus:outline-none focus:border-blue-400 flex-1 min-w-0 h-7 text-xs"
      />
    </div>
    <Button
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0 text-white hover:bg-white/20 shrink-0"
      onClick={onPlus}
    >
      <Plus className="w-3.5 h-3.5" />
    </Button>
  </div>
);
