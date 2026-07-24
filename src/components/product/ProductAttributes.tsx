import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = 'ewhz3384@gmail.com';

type Attrs = {
  season: number;
  longevity: number;
  gender_tendency: number;
  uniqueness: number;
};

const DEFAULTS: Attrs = { season: 50, longevity: 50, gender_tendency: 50, uniqueness: 50 };

const FIELDS: Array<{
  key: keyof Attrs;
  label: string;
  left: string;
  right: string;
  center?: string;
}> = [
  { key: 'season', label: 'Season', left: 'Summer', right: 'Winter' },
  { key: 'longevity', label: 'Longevity', left: '< 4h', right: '12h+' },
  { key: 'gender_tendency', label: 'Gender', left: 'Masculine', right: 'Feminine', center: 'Unisex' },
  { key: 'uniqueness', label: 'Uniqueness', left: 'Mainstream', right: 'Niche' },
];

interface Props {
  productId: string;
}

export const ProductAttributes = ({ productId }: Props) => {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [attrs, setAttrs] = useState<Attrs>(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Attrs>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('product_attributes')
        .select('season,longevity,gender_tendency,uniqueness')
        .eq('product_id', productId)
        .maybeSingle();
      if (!cancelled && data) setAttrs(data as Attrs);
    })();
    return () => { cancelled = true; };
  }, [productId]);

  const startEdit = () => {
    setDraft(attrs);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('product_attributes')
      .upsert({ product_id: productId, ...draft }, { onConflict: 'product_id' });
    setSaving(false);
    if (!error) {
      setAttrs(draft);
      setEditing(false);
    }
  };

  return (
    <div className="relative bg-background/40 backdrop-blur-md border border-border/60 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-6 bg-accent" />
          <h3 className="text-[10px] tracking-[0.3em] uppercase text-foreground/80 font-medium">
            Fragrance Profile
          </h3>
        </div>
        {isAdmin && !editing && (
          <button
            onClick={startEdit}
            className="p-1.5 text-foreground/50 hover:text-accent transition-colors"
            aria-label="Edit attributes"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {isAdmin && editing && (
          <div className="flex gap-1">
            <button
              onClick={save}
              disabled={saving}
              className="p-1.5 text-accent hover:opacity-80 transition disabled:opacity-50"
              aria-label="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 text-foreground/50 hover:text-foreground transition"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 md:gap-x-10 gap-y-7">
        {FIELDS.map((f) => {
          const value = editing ? draft[f.key] : attrs[f.key];
          return (
            <div key={f.key} className="min-w-0">
              <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
                {f.label}
              </p>
              <div className="relative h-[2px] bg-border/80">
                {/* filled portion */}
                <div
                  className="absolute top-0 left-0 h-full bg-accent/40"
                  style={{ width: `${value}%` }}
                />
                {/* indicator */}
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-[2px] h-4 bg-accent shadow-[0_0_8px_hsl(var(--accent)/0.6)] transition-all",
                    editing && "h-5"
                  )}
                  style={{ left: `calc(${value}% - 1px)` }}
                />
                {editing && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) =>
                      setDraft({ ...draft, [f.key]: Number(e.target.value) })
                    }
                    className="absolute -inset-y-3 inset-x-0 w-full opacity-0 cursor-pointer"
                  />
                )}
              </div>
              <div className="flex justify-between items-center gap-1 mt-3 text-[8px] md:text-[10px] leading-tight tracking-[0.06em] md:tracking-[0.15em] uppercase text-foreground/60 whitespace-nowrap">
                <span className="truncate">{f.left}</span>
                {f.center && <span className="text-accent/80 truncate">{f.center}</span>}
                <span className="truncate">{f.right}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
