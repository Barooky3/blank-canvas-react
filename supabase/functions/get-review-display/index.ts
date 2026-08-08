import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Mirror of src/data/homeReviews.ts seed list. Kept server-side so the
// override/hidden mapping never leaks to public visitors.
interface HomeReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
}

const homeReviews: HomeReview[] = [
  { id: 'r1', name: 'Anonymous', rating: 5, text: 'arrived fast, found on tiktok, smells exactly like the og, super happy', date: '29 Apr 2026', verified: true },
  { id: 'r2', name: 'Anonymous', rating: 5, text: '', date: '16 Mar 2026', verified: true },
  { id: 'r3', name: 'Anonymous', rating: 5, text: "I did a review before a 2 star one about my bottle having a dent in it im just putting this here because i contacted support and they offered to send me a replacement bottle without me returning mine. Just wanted to put this review here so the rating isnt so low cuz of my other one and plus free gift", date: '20 Feb 2026', verified: true },
  { id: 'r4', name: 'Anonymous', rating: 5, text: '', date: '10 Feb 2026', verified: true },
  { id: 'r5', name: 'Lukas M.', rating: 5, text: 'schnell geliefert alles top verpackt danke', date: '03 Feb 2026', verified: true },
  { id: 'r6', name: 'Philip K.', rating: 5, text: 'exactly what i needed, performance is insane', date: '27 Jan 2026', verified: true },
  { id: 'r7', name: 'Anna K.', rating: 5, text: 'danke! produkt wie beschrieben gerne wieder', date: '20 Jan 2026', verified: true },
  { id: 'r8', name: 'Katrien V.', rating: 4, text: 'quality good, delivery to belgium took a while but support helped', date: '13 Jan 2026', verified: true },
  { id: 'r9', name: 'Michael S.', rating: 5, text: 'alles cool, offseason bestellung kam problemlos', date: '06 Jan 2026', verified: true },
  { id: 'r10', name: 'Anonymous', rating: 5, text: 'discreet packaging, no complaints', date: '30 Dec 2025', verified: true },
  { id: 'r11', name: 'James T.', rating: 5, text: 'winter scent sorted, will reorder', date: '23 Dec 2025', verified: true },
  { id: 'r12', name: 'Carmen S.', rating: 4, text: 'buena calidad, el envío a España un poco lento', date: '16 Dec 2025', verified: true },
  { id: 'r13', name: 'Stefan B.', rating: 5, text: 'top produkt und schneller versand danke', date: '09 Dec 2025', verified: true },
  { id: 'r14', name: 'Anonymous', rating: 5, text: 'reliable, discreet, happy with it', date: '02 Dec 2025', verified: true },
  { id: 'r15', name: 'Julia W.', rating: 5, text: 'diskrete verpackung produkt passt empfehlung', date: '25 Nov 2025', verified: true },
  { id: 'r16', name: 'Thomas W.', rating: 5, text: 'erste bestellung lief smooth, wiederholung folgt', date: '10 Nov 2025', verified: true },
  { id: 'r17', name: 'Marco G.', rating: 3, text: 'Prodotto ok, ma la consegna in Italia ha richiesto quasi 2 settimane. Supporto gentile comunque.', date: '25 Sept 2025', verified: true },
  { id: 'r18', name: 'Alessandro V.', rating: 5, text: 'Ottimo prodotto, spedizione discreta. Tutto perfetto.', date: '18 Sept 2025', verified: true },
  { id: 'r19', name: 'Kevin S.', rating: 2, text: 'Paket kam beschädigt an. Inhalt war zwar okay, aber die Polsterung war echt mies für den Preis.', date: '10 Sept 2025', verified: true },
  { id: 'r20', name: 'Dr. T.', rating: 5, text: 'projection and longevity confirmed, smells legit.', date: '02 Sept 2025', verified: true },
  { id: 'r21', name: 'John M.', rating: 4, text: "Everything fine, but I hate that standard PayPal isn't accepted.", date: '25 Aug 2025', verified: true },
  { id: 'r22', name: 'Lars H.', rating: 1, text: "Scam? My order didn't arrive for 3 weeks... Edit: It arrived today, customs held it. Quality is actually good, but the stress was too much.", date: '15 Aug 2025', verified: true },
  { id: 'r23', name: 'Javier R.', rating: 5, text: 'Perfecto! Muy rapido.', date: '05 Aug 2025', verified: true },
  { id: 'r24', name: 'Dimitri W.', rating: 5, text: 'Besten in der EU. Punkt.', date: '28 Jul 2025', verified: true },
  { id: 'r25', name: 'Mateusz P.', rating: 5, text: 'Bardzo dobra jakość, szybka przesyłka do Polski.', date: '20 Jul 2025', verified: true },
  { id: 'r26', name: 'Anonymous', rating: 5, text: "Super discreet, partner didn't suspect a thing lol.", date: '05 Jul 2025', verified: true },
  { id: 'r27', name: 'Fabien L.', rating: 5, text: 'Utilisé tous les jours, sillage excellent.', date: '28 Jun 2025', verified: true },
  { id: 'r28', name: 'Tom H.', rating: 4, text: 'Solid stuff. A bit pricey but worth it for a clearance bottle.', date: '20 Jun 2025', verified: true },
  { id: 'r29', name: 'Anonymous', rating: 5, text: 'Always reliable.', date: '12 Jun 2025', verified: true },
  { id: 'r30', name: 'Christian R.', rating: 5, text: 'Hab viele Shops probiert, bleibe jetzt hier. Top-Qualität.', date: '05 Jun 2025', verified: true },
  { id: 'r31', name: 'Erik J.', rating: 4, text: 'Versand nach Schweden war okay, 6 Tage.', date: '28 May 2025', verified: true },
  { id: 'r32', name: 'Sarah J.', rating: 5, text: 'Great support team, answered all my questions about the batch.', date: '20 May 2025', verified: true },
  { id: 'r33', name: 'Basti', rating: 5, text: 'Top top top.', date: '12 May 2025', verified: true },
  { id: 'r34', name: 'Anonymous', rating: 2, text: 'Shipping took too long and the box was slightly crushed. Bottle inside was fine though.', date: '05 May 2025', verified: true },
  { id: 'r35', name: 'Liam O.', rating: 5, text: 'Incredible value for this price point.', date: '28 Apr 2025', verified: true },
  { id: 'r36', name: 'Mo', rating: 5, text: 'Einfach stabil.', date: '20 Apr 2025', verified: true },
  { id: 'r37', name: 'Chloé M.', rating: 5, text: "Livraison discrète, merci à l'équipe.", date: '12 Apr 2025', verified: true },
  { id: 'r38', name: 'Anonymous', rating: 4, text: 'Everything okay, will order again.', date: '05 Apr 2025', verified: true },
  { id: 'r39', name: 'Jürgen T.', rating: 5, text: 'Absolut zufrieden, danke für die schnelle Abwicklung!', date: '28 Mar 2025', verified: true },
  { id: 'r40', name: 'Anonymous', rating: 5, text: 'The only shop I trust for my signature scents.', date: '20 Mar 2025', verified: true },
  { id: 'r41', name: 'Petr S.', rating: 5, text: 'Fast shipping to Prague. Quality is A+.', date: '12 Mar 2025', verified: true },
];

interface UnifiedSeed {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  source: 'seed';
  status: 'approved';
  images?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data } = await supabase
      .from('review_order')
      .select('order_ids, seed_overrides, hidden_seeds')
      .eq('id', 1)
      .maybeSingle();

    const order_ids: string[] = Array.isArray((data as any)?.order_ids) ? (data as any).order_ids : [];
    const overrides: Record<string, { name?: string; rating?: number; text?: string; images?: string[] }> =
      (data as any)?.seed_overrides && typeof (data as any).seed_overrides === 'object'
        ? (data as any).seed_overrides
        : {};
    const hidden: string[] = Array.isArray((data as any)?.hidden_seeds) ? (data as any).hidden_seeds : [];

    const seeds: UnifiedSeed[] = homeReviews
      .map((r) => {
        const id = `seed-${r.id}`;
        const o = overrides[id] || {};
        return {
          id,
          name: o.name ?? r.name,
          rating: o.rating ?? r.rating,
          text: o.text ?? r.text,
          date: r.date,
          verified: r.verified,
          source: 'seed' as const,
          status: 'approved' as const,
          images: o.images,
        };
      })
      .filter((r) => !hidden.includes(r.id));

    return new Response(JSON.stringify({ order_ids, seeds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ order_ids: [], seeds: [], error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
