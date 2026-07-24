import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Privacy-safe: synthetic seed names only. Do NOT query real customer data here.
const SEED: { display: string; country: string }[] = [
  { display: 'Daan V.', country: 'Netherlands' },
  { display: 'Sem J.', country: 'Netherlands' },
  { display: 'Lieke B.', country: 'Netherlands' },
  { display: 'Wout P.', country: 'Belgium' },
  { display: 'Tibo J.', country: 'Belgium' },
  { display: 'Lore M.', country: 'Belgium' },
  { display: 'Lukas M.', country: 'Germany' },
  { display: 'Finn S.', country: 'Germany' },
  { display: 'Mia W.', country: 'Germany' },
  { display: 'Hugo M.', country: 'France' },
  { display: 'Louis B.', country: 'France' },
  { display: 'Léa D.', country: 'France' },
  { display: 'Oliver S.', country: 'United Kingdom' },
  { display: 'George T.', country: 'United Kingdom' },
  { display: 'Amelia B.', country: 'United Kingdom' },
  { display: 'Mateo G.', country: 'Spain' },
  { display: 'Lucía F.', country: 'Spain' },
  { display: 'Leonardo R.', country: 'Italy' },
  { display: 'Sofia B.', country: 'Italy' },
  { display: 'Antoni N.', country: 'Poland' },
  { display: 'Zuzanna K.', country: 'Poland' },
  { display: 'Liam A.', country: 'Sweden' },
  { display: 'Astrid J.', country: 'Sweden' },
  { display: 'Ethan J.', country: 'United States' },
  { display: 'Sophia W.', country: 'United States' },
  { display: 'Liam S.', country: 'Canada' },
  { display: 'Emma T.', country: 'Canada' },
  { display: 'Santiago S.', country: 'Portugal' },
  { display: 'Leonor P.', country: 'Portugal' },
  { display: 'Felix G.', country: 'Austria' },
  { display: 'Anna H.', country: 'Austria' },
  { display: 'Noah N.', country: 'Denmark' },
  { display: 'Alma J.', country: 'Denmark' },
  { display: 'Jakob H.', country: 'Norway' },
  { display: 'Nora O.', country: 'Norway' },
  { display: 'Luca M.', country: 'Switzerland' },
  { display: 'Elena K.', country: 'Switzerland' },
  { display: 'Conor M.', country: 'Ireland' },
  { display: 'Aoife K.', country: 'Ireland' },
  { display: 'Luka H.', country: 'Croatia' },
  { display: 'Ana K.', country: 'Croatia' },
  { display: 'Andrei P.', country: 'Romania' },
  { display: 'Maria I.', country: 'Romania' },
  { display: 'Georgi I.', country: 'Bulgaria' },
  { display: 'Elena D.', country: 'Bulgaria' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  return new Response(JSON.stringify({ entries: SEED }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    status: 200,
  });
});
