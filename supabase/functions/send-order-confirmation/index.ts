import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const DEFAULT_SELLER_LINK = "https://litbuy.shop/lit/I2wvc0a2";

const SITE_URL = "https://parfumistry.net";

// Perfume bottle images hosted on Lovable Cloud storage (same-origin as sender for deliverability)
// IMPORTANT: More specific keys MUST come before less specific ones to avoid prefix matching bugs
const PRODUCT_IMAGES: Record<string, string> = {
  // Specific variants first (before their base names)
  "aventus-absolu": "https://parfumistry.net/__l5e/assets-v1/4b69e35d-0b00-4464-9914-0be1e0498a26/creed-aventus-absolu-8001034.png",
  "born-in-roma-coral-fantasy": "https://parfumistry.net/__l5e/assets-v1/afafadb0-2801-4c1d-9e19-edc9311e7188/valentino.png",
  "born-in-roma-green-stravaganza": "https://parfumistry.net/__l5e/assets-v1/a2ff4360-49ea-4171-a32e-8f20a20ab659/valentino-born-in-roma-8991381.png",
  "born-in-roma-intense": "https://parfumistry.net/__l5e/assets-v1/a2ff4360-49ea-4171-a32e-8f20a20ab659/valentino-born-in-roma-8991381.png",
  "stronger-with-you-absolutely": "https://parfumistry.net/__l5e/assets-v1/38f1e029-be5c-4b39-9a07-a5fed0c05d5e/stronger-with-you-absolute-8775051.png",
  "stronger-with-you-amber": "https://parfumistry.net/__l5e/assets-v1/3d725ac3-4f23-46ab-ae82-3ddfd2945fa4/1C01C9E5-CAD8-4745-8AED-B06A573E591B_converted_1.png",
  "stronger-with-you-intensely": "https://parfumistry.net/__l5e/assets-v1/f5d50aad-55e2-44e4-ab15-9a680cbe70a9/73584D90-E000-4F86-8CF6-647F94B4F567_converted_1.png",
  "stronger-with-you-parfum": "https://parfumistry.net/__l5e/assets-v1/01a23970-6f77-489e-931b-f20993ad520a/stronger-with-you-parfum-2174125.png",
  "le-male-elixir-absolu": "https://parfumistry.net/__l5e/assets-v1/a6e64020-9d4f-417e-97fc-87fda75eefac/gold_resized_to_match_black_object_1.png",
  "le-male-elixir": "https://parfumistry.net/__l5e/assets-v1/3103b71e-0b1b-45ef-9df0-60bc0381ba4e/F5DB0F17-85A7-4892-BB9E-F7BE8D91B966_converted_1.png",
  "le-male-le-parfum": "https://parfumistry.net/__l5e/assets-v1/af0482c0-855a-414f-b804-6165d3f31560/jean-paul-gaultier-le-male-le-parfum-9203208.png",
  "le-beau-le-parfum": "https://parfumistry.net/__l5e/assets-v1/75186f8e-e2ac-4989-a079-2283c0b62222/CD9D450B-B45D-4AB9-9750-9BD6AD00DB2F_png_only_1.png",
  "le-beau-edt": "https://parfumistry.net/__l5e/assets-v1/bacfca61-ba6f-46eb-a016-8335cf10fd42/jpg_le_beau_edt_bg_removed_1_1.png",
  "the-most-wanted-edp-intense": "https://parfumistry.net/__l5e/assets-v1/859a1dda-bd37-433d-8956-8c2d176d869e/product_2_matched_1.png",
  "the-most-wanted-parfum": "https://parfumistry.net/__l5e/assets-v1/79a259cf-d0d3-41de-a33f-8618dd81b3cd/product_3_matched_1.png",
  "eros-energy": "https://parfumistry.net/__l5e/assets-v1/914e7078-68d9-460e-b9be-c580ec8db7d4/yellow_resized_to_red_d0d3284b-0228-4acd-8b37-3765a0c838d8.png",
  "eros-flame": "https://parfumistry.net/__l5e/assets-v1/6fa1d9f3-68c8-46ae-8a1b-2daf3035de30/A2B6CEE1-52D5-4900-AE35-97311C0903DF_transparent_1.png",
  "eros-parfum": "https://parfumistry.net/__l5e/assets-v1/86fcf4b3-278d-4943-975e-77197507346f/versace-eros-2404971.png",
  "1-million-elixir": SITE_URL + "/images/scent-notes/1-million-elixir.png",
  "1-million-parfum": SITE_URL + "/images/scent-notes/1-million-parfum.png",
  // Base names (after their specific variants)
  "amore-caffe": "https://parfumistry.net/__l5e/assets-v1/c601a644-7747-493b-bf58-cd0477fdb2fd/mancera-amore-caffe-1050170.png",
  "althair": "https://parfumistry.net/__l5e/assets-v1/9c3b2dbe-4661-4856-bf9e-137cf77e76f0/parfums-de-marly-althair-7480525.png",
  "aoud-lemon-mint": "https://parfumistry.net/__l5e/assets-v1/8a82491d-5064-4962-9c7e-cfe90b91ea7a/mancera-aoud-lemon-mint-3807519.png",
  "aoud-vanille": "https://parfumistry.net/__l5e/assets-v1/99f28802-cff0-434d-bcfe-39311434a237/mancera-aoud-vanille-5716076.png",
  "aventus": "https://parfumistry.net/__l5e/assets-v1/473bcb37-8a33-45d8-b018-a0d9e2d6c339/creed-aventus-1140157.png",
  "black-orchid": "https://parfumistry.net/__l5e/assets-v1/6f12d646-ff88-4a67-aa29-86abcd9ea65b/tom-ford-black-orchid-1912271.png",
  "black-opium": "https://parfumistry.net/__l5e/assets-v1/fac9d91b-eaa1-4999-9530-548fcb975975/ysl-black-opium-3914424.png",
  "born-in-roma": "https://parfumistry.net/__l5e/assets-v1/a2ff4360-49ea-4171-a32e-8f20a20ab659/valentino-born-in-roma-8991381.png",
  "cedrat-boise": "https://parfumistry.net/__l5e/assets-v1/2123799c-c009-4271-b0ef-efe81abc10e1/mancera-cedrat-boise-8376726.png",
  "delina": "https://parfumistry.net/__l5e/assets-v1/71dda314-1668-4724-b764-6eb7d54ffb5a/second_image_matched_dimensions_smaller.png",
  "erba-gold": "https://parfumistry.net/__l5e/assets-v1/4edee890-4f38-4307-a637-069ee600372c/xerjoff-erba-gold-9327888.png",
  "erba-pura": "https://parfumistry.net/__l5e/assets-v1/f8bd0afa-6a78-43c3-970c-549beca65cef/xerjoff-erba-pura-8755466.png",
  "french-riviera": "https://parfumistry.net/__l5e/assets-v1/1b7bcc92-64c5-4735-acae-7afaca25a408/mancera-french-riviera-9959440.png",
  "khamrah-qahwa": "https://parfumistry.net/__l5e/assets-v1/7564ff7a-dc0a-455d-90e7-63e087eeac59/lataffa-khamrah-qahwa-4225237.png",
  "khamrah-parfum": "https://parfumistry.net/__l5e/assets-v1/880fe655-6e8e-4acb-bb77-b69dc8846f29/lattafa-khamrah-6018164.png",
  "imagination": "https://parfumistry.net/__l5e/assets-v1/e2723047-53c3-4a97-bf61-c98f7a9e71c6/product_4_matched_1.png",
  "layton": "https://parfumistry.net/__l5e/assets-v1/1a338fbd-a642-470e-aa04-cdf860826a14/parfums-de-marly-layton-9771652.png",
  "libre": "https://parfumistry.net/__l5e/assets-v1/abe04844-4d59-410e-b4e4-69affe22985f/ysl-libre-8359553.png",
  "mon-paris": "https://parfumistry.net/__l5e/assets-v1/95ba9f0e-5b95-421d-bb0d-ab917dad618b/yves-saint-laurent-mon-paris-7356496.png",
  "myself-edp": "https://parfumistry.net/__l5e/assets-v1/0f193cb0-a3f6-468c-8d16-bdb3e3bed7c3/ysl-myslf-eau-de-parfum-1896916.png",
  "naxos": "https://parfumistry.net/__l5e/assets-v1/60dd052a-43b0-40ce-80ff-c7c57c9171d9/xerjoff-naxos-3352432.png",
  "paradigme": "https://parfumistry.net/__l5e/assets-v1/941acd49-706a-444c-9d9c-677a92d7a39d/prada_resized_uniform_54c5598a-9a6e-47d7-8803-0a385e54b9c6.png",
  "paradoxe": SITE_URL + "/images/scent-notes/prada-paradoxe.png",
  "pacific": "https://parfumistry.net/__l5e/assets-v1/f05246ac-1d4e-4a45-9437-c1008aa515d8/image_6261aa49-3221-4a96-91e9-c8d120107fc0.png",
  "phantom": SITE_URL + "/images/scent-notes/phantom-parfum.png",
  "red-tobacco": "https://parfumistry.net/__l5e/assets-v1/e7cae788-53f9-4909-a9eb-15ecfacae64f/mancera-red-tobacco-3937206.png",
  "sauvage-parfum": "https://parfumistry.net/__l5e/assets-v1/82b46afe-da13-4a5b-99b1-9466613df4c3/dior-sauvage-3604373.png",
  "silver-mountain-water": "https://parfumistry.net/__l5e/assets-v1/9b0d49b0-842d-4c46-9ebc-b0e9e834b8ec/creed-silver-mountain-water-3465174.png",
  "spicebomb-extreme": "https://parfumistry.net/__l5e/assets-v1/12fba35e-4bb4-4223-96fc-e26c2c82412a/spicebomb.png",
  "symphony": "https://parfumistry.net/__l5e/assets-v1/1aa9b4eb-5839-4234-98f9-de15aa933c84/image_f5380ed8-72f9-4429-ae98-588f5395b6ba.png",
  "homme-intense": "https://parfumistry.net/__l5e/assets-v1/ce54d6a0-4631-4072-b3fd-9a89d28b14a2/dior-homme-intense-7103864.png",
  "elixir-absolu": "https://parfumistry.net/__l5e/assets-v1/a6e64020-9d4f-417e-97fc-87fda75eefac/gold_resized_to_match_black_object_1.png",
  "tonka-cola": "https://parfumistry.net/__l5e/assets-v1/18f2f8f9-2f90-44cb-af03-42fd0490f439/mancera-tonka-cola-5797937.png",
  "xplicit-vanilla": "https://parfumistry.net/__l5e/assets-v1/5d6d11e8-4a63-4a48-a5ec-257ccf58cc7f/mancera-xplicit-vanilla-7508759.png",
  "y-eau-de-parfum": SITE_URL + "/images/scent-notes/ysl-y-edp.png",
  "ysl-y": SITE_URL + "/images/scent-notes/ysl-y-edp.png",
  // Bundles
  "evening-sweetheart": "https://parfumistry.net/__l5e/assets-v1/453d5d66-bfec-4681-b842-80517be03b83/fragrance-bundle-evening-sweetheart-9560408.png",
  "young-playboy": "https://parfumistry.net/__l5e/assets-v1/7edc3b57-82a2-412c-a106-cc1e0b021845/fragrance-bundle-young-playboy-9880709.png",
  "sleek-and-clean": "https://parfumistry.net/__l5e/assets-v1/0184896a-656b-4a39-9fd0-232fda79436f/fragrance-bundle-sleek-and-clean-3751514.png",
  "jpg-collection": "https://parfumistry.net/__l5e/assets-v1/af0482c0-855a-414f-b804-6165d3f31560/jean-paul-gaultier-le-male-le-parfum-9203208.png",
};

// Strip accents for matching (é→e, ô→o, etc.)
function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function resolveProductImage(name: string, originalImage: string): string {
  const n = stripAccents(name.toLowerCase());
  for (const [key, url] of Object.entries(PRODUCT_IMAGES)) {
    if (n.includes(key.replace(/-/g, " "))) return url;
  }
  // Fallback: if the original image is from the CDN or lovable.app, use it
  if (originalImage && (originalImage.includes("supabase.co/storage") || originalImage.includes("lovable.app") || originalImage.includes("parfumistry.net"))) return originalImage;
  // Last resort: try to make local paths work via site URL
  if (originalImage && originalImage.startsWith("/")) return SITE_URL + originalImage;
  // If no image at all, return a placeholder
  if (!originalImage) return SITE_URL + "/placeholder.svg";
  return originalImage;
}

const PRODUCT_LINKS: Record<string, string> = {
  "stronger-with-you-absolutely": "https://litbuy.com/product/1688/993578833339?inviteCode=QMYK3RAL2",
  "stronger-with-you": "https://litbuy.com/product/1688/993578833339?inviteCode=QMYK3RAL2",
  "aventus": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7661817242&affcode=c5v3b",
  "born-in-roma-intense": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "born-in-roma-green-stravaganza": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "born-in-roma-coral-fantasy": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "born-in-roma": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "valentino": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "louis-vuitton": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7661789506&affcode=c5v3b",
  "imagination": "https://litbuy.com/product/0/997021564651?inviteCode=4W9SCOLDU",
  "pacific": "https://litbuy.com/product/0/997021564651?inviteCode=4W9SCOLDU",
  "symphony": "https://litbuy.com/product/0/951498715527?inviteCode=4W9SCOLDU",
  "1-million-elixir": "https://litbuy.com/product/0/995959242718?inviteCode=4W9SCOLDU",
  "1-million-parfum": "https://litbuy.com/product/0/995959242718?inviteCode=4W9SCOLDU",
  "prada-paradoxe": "https://litbuy.com/product/0/953992936772?inviteCode=4W9SCOLDU",
  "phantom": "https://litbuy.com/product/0/966979827880?inviteCode=4W9SCOLDU",
  "ysl-y": "https://litbuy.com/product/0/980330643616?inviteCode=4W9SCOLDU",
  "libre": "https://litbuy.com/product/0/873128790811?inviteCode=4W9SCOLDU",
  "mon-paris": "https://litbuy.com/product/0/762497810755?inviteCode=4W9SCOLDU",
  "xerjoff": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7662173327&affcode=c5v3b",
  "eros": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7665241752&affcode=c5v3b",
  "dior": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7661870378&affcode=c5v3b",
  "parfums-de-marly": "https://m.orientdig.com/pages/product/product?id=857200052892&shoptype=ALI_1688&ref=100144636",
  "le-male-elixir": "https://litbuy.com/product/0/858098262202?inviteCode=4W9SCOLDU",
  "jean-paul-gaultier": "https://litbuy.shop/lit/JeaFpAPH",
  "lattafa": "https://litbuy.shop/lit/XVWEmSku",
  "azzaro": "https://litbuy.shop/lit/hVExk1tS",
  "mancera": "https://litbuy.shop/lit/qYJ4Tj6g",
};

function getProductLink(name: string, brand: string, itemAffiliateUrl?: string): string {
  // Prefer the affiliate URL passed from the product data, but skip internal routes
  if (itemAffiliateUrl && itemAffiliateUrl.startsWith("http")) return itemAffiliateUrl;
  const n = name.toLowerCase();
  const b = brand.toLowerCase();
  if (n.includes("stronger with you absolutely")) return PRODUCT_LINKS["stronger-with-you-absolutely"];
  if (n.includes("stronger with you")) return PRODUCT_LINKS["stronger-with-you"];
  if (n.includes("imagination")) return PRODUCT_LINKS["imagination"];
  if (n.includes("pacific")) return PRODUCT_LINKS["pacific"];
  if (n.includes("symphony")) return PRODUCT_LINKS["symphony"];
  if (n.includes("1 million elixir")) return PRODUCT_LINKS["1-million-elixir"];
  if (n.includes("1 million parfum")) return PRODUCT_LINKS["1-million-parfum"];
  if (n.includes("prada paradoxe") || n.includes("paradoxe")) return PRODUCT_LINKS["prada-paradoxe"];
  if (n.includes("phantom")) return PRODUCT_LINKS["phantom"];
  if (n.includes("ysl y ") || n.includes("y edp") || n.includes("y eau de parfum")) return PRODUCT_LINKS["ysl-y"];
  if (n.includes("libre")) return PRODUCT_LINKS["libre"];
  if (n.includes("mon paris")) return PRODUCT_LINKS["mon-paris"];
  if (n.includes("aventus")) return PRODUCT_LINKS["aventus"];
  if (n.includes("born in roma intense")) return PRODUCT_LINKS["born-in-roma-intense"];
  if (n.includes("born in roma green stravaganza")) return PRODUCT_LINKS["born-in-roma-green-stravaganza"];
  if (n.includes("born in roma coral fantasy")) return PRODUCT_LINKS["born-in-roma-coral-fantasy"];
  if (n.includes("born in roma")) return PRODUCT_LINKS["born-in-roma"];
  if (b.includes("valentino")) return PRODUCT_LINKS["valentino"];
  if (b.includes("louis vuitton")) return PRODUCT_LINKS["louis-vuitton"];
  if (b.includes("xerjoff")) return PRODUCT_LINKS["xerjoff"];
  if (n.includes("eros")) return PRODUCT_LINKS["eros"];
  if (b.includes("dior")) return PRODUCT_LINKS["dior"];
  if (b.includes("parfums de marly")) return PRODUCT_LINKS["parfums-de-marly"];
  if (n.includes("le male elixir")) return PRODUCT_LINKS["le-male-elixir"];
  if (b.includes("jean paul gaultier")) return PRODUCT_LINKS["jean-paul-gaultier"];
  if (b.includes("lattafa")) return PRODUCT_LINKS["lattafa"];
  if (b.includes("azzaro")) return PRODUCT_LINKS["azzaro"];
  if (b.includes("mancera")) return PRODUCT_LINKS["mancera"];
  return DEFAULT_SELLER_LINK;
}

interface OrderItem {
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
  selectedMl?: number;
  affiliateUrl?: string;
  product_id?: string;
}

interface PaddingOverride {
  padding_top: number;
  padding_right: number;
  padding_bottom: number;
  padding_left: number;
  scale: number;
}

async function fetchPaddingOverrides(productIds: string[]): Promise<Record<string, PaddingOverride>> {
  const ids = Array.from(new Set(productIds.filter(Boolean)));
  if (ids.length === 0) return {};
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return {};
    const inList = ids.map((id) => `"${id}"`).join(",");
    const res = await fetch(
      `${supabaseUrl}/rest/v1/product_padding_overrides?select=product_id,padding_top,padding_right,padding_bottom,padding_left,scale&product_id=in.(${inList})`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    if (!res.ok) return {};
    const rows = await res.json();
    const map: Record<string, PaddingOverride> = {};
    for (const r of rows) {
      map[r.product_id] = {
        padding_top: Number(r.padding_top) || 0,
        padding_right: Number(r.padding_right) || 0,
        padding_bottom: Number(r.padding_bottom) || 0,
        padding_left: Number(r.padding_left) || 0,
        scale: Number(r.scale) || 1,
      };
    }
    return map;
  } catch (e) {
    console.error("Failed to fetch padding overrides:", e);
    return {};
  }
}

// Email-safe padding: most clients (Gmail, Outlook, Apple Mail) strip CSS `transform`,
// so we translate the padding/scale override into concrete width/height + margin values
// on the <img> itself. Returns the full inner <img> tag to place inside a 72x72 box.
function paddingImgTag(imageUrl: string, alt: string, o?: PaddingOverride): string {
  const BOX = 72;
  const hasAny = o && (o.padding_top || o.padding_right || o.padding_bottom || o.padding_left || (o.scale && o.scale !== 1));
  if (!o || !hasAny) {
    return `<img src="${imageUrl}" alt="${alt}" width="${BOX}" height="${BOX}" style="display:block;width:${BOX}px;height:${BOX}px;object-fit:cover;" />`;
  }
  const scale = Math.max(0.2, Math.min(2, o.scale || 1));
  const size = Math.round(BOX * scale);
  // Same 2.5% per unit as the on-site transform, applied to the 72px box.
  const shiftX = Math.round(((o.padding_left - o.padding_right) * 2.5 / 100) * BOX);
  const shiftY = Math.round(((o.padding_top - o.padding_bottom) * 2.5 / 100) * BOX);
  // Center the (possibly scaled) image in the 72x72 box, then apply directional shifts.
  const marginTop = Math.round((BOX - size) / 2) + shiftY;
  const marginLeft = Math.round((BOX - size) / 2) + shiftX;
  return `<img src="${imageUrl}" alt="${alt}" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;margin:${marginTop}px 0 0 ${marginLeft}px;object-fit:contain;object-position:bottom center;" />`;
}

const BUNDLE_BONUS_LINKS: Record<string, { label: string; url: string }[]> = {
  "evening-sweetheart": [
    { label: "JPG Le Male Elixir", url: PRODUCT_LINKS["le-male-elixir"] },
    { label: "Valentino Born in Roma Intense", url: PRODUCT_LINKS["valentino"] },
    { label: "Azzaro The Most Wanted Parfum", url: PRODUCT_LINKS["azzaro"] },
    { label: "JPG Le Male Le Parfum", url: PRODUCT_LINKS["jean-paul-gaultier"] },
  ],
  "young-playboy": [
    { label: "JPG Le Male Elixir", url: PRODUCT_LINKS["le-male-elixir"] },
    { label: "Stronger With You Absolutely", url: PRODUCT_LINKS["stronger-with-you-absolutely"] },
    { label: "1 Million Elixir", url: PRODUCT_LINKS["1-million-elixir"] },
  ],
  "sleek-and-clean": [
    { label: "YSL Myself EDP", url: PRODUCT_LINKS["ysl-y"] },
    { label: "YSL Y EDP", url: PRODUCT_LINKS["ysl-y"] },
    { label: "Dior Sauvage Parfum", url: PRODUCT_LINKS["dior"] },
  ],
  "jpg-collection": [
    { label: "JPG Le Male Elixir", url: PRODUCT_LINKS["le-male-elixir"] },
    { label: "JPG Le Male Le Parfum", url: PRODUCT_LINKS["jean-paul-gaultier"] },
    { label: "JPG Le Beau Le Parfum", url: PRODUCT_LINKS["jean-paul-gaultier"] },
  ],
};

function getBundleBonusLinks(name: string): { label: string; url: string }[] {
  const n = name.toLowerCase();
  if (n.includes("evening sweetheart")) return BUNDLE_BONUS_LINKS["evening-sweetheart"];
  if (n.includes("young playboy")) return BUNDLE_BONUS_LINKS["young-playboy"];
  if (n.includes("sleek") && n.includes("clean")) return BUNDLE_BONUS_LINKS["sleek-and-clean"];
  if (n.includes("jpg") || n.includes("jpg collection")) return BUNDLE_BONUS_LINKS["jpg-collection"];
  return [];
}

function buildItemRow(item: OrderItem, origin: string, showImage: boolean, padding?: PaddingOverride): string {
  const mlLabel = item.selectedMl ? ` — ${item.selectedMl}ml` : "";
  const lineTotal = (item.price * item.quantity).toFixed(2);
  const imageUrl = resolveProductImage(item.name, item.image);
  const isSample = item.price === 0 || /sample/i.test(item.name);
  const cleanName = item.name.replace(/\s*[—-]\s*Free\s*2ml\s*Sample\s*🎁?/i, '').trim();
  const priceLabel = isSample
    ? `Qty: ${item.quantity} · <span style="color:#c9a96e;font-weight:600;">FREE GIFT 🎁</span>`
    : `Qty: ${item.quantity} · €${lineTotal}`;
  const giftBadge = isSample
    ? `<div style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#1a1a1a;background:#c9a96e;padding:2px 8px;border-radius:3px;margin-bottom:6px;">Complimentary 2ml Sample</div>`
    : '';
  const rowBg = isSample ? 'background-color:#fdf8ee;' : '';
  const imgTag = paddingImgTag(imageUrl, cleanName, padding);

  return `<tr>
<td style="padding: 16px 0; border-bottom: 1px solid #eee; vertical-align: top; ${rowBg}">
<table cellpadding="0" cellspacing="0" border="0"><tr>
${showImage ? `<td style="width: 80px; vertical-align: top;">
<div style="width:72px;height:72px;border-radius:8px;border:1px solid #eee;overflow:hidden;background:#fafafa;">
${imgTag}
</div>
</td>` : ""}
<td style="padding-left: 16px; vertical-align: top; font-family: Helvetica Neue, Arial, sans-serif;">
${giftBadge}
<div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 4px;">${item.brand}</div>
<div style="font-size: 15px; font-weight: 500; color: #1a1a1a; margin-bottom: 4px;">${cleanName}${mlLabel}</div>
<div style="font-size: 13px; color: #666; margin-bottom: 8px;">${priceLabel}</div>
</td></tr></table>
</td></tr>`;
}

function buildItemsHtml(items: OrderItem[], origin: string, paddingMap: Record<string, PaddingOverride> = {}): string {
  return items.map((item) => buildItemRow(item, origin, true, item.product_id ? paddingMap[item.product_id] : undefined)).join("");
}

function buildEmailHtml(
  customerName: string,
  itemsHtml: string,
  totalAmount: string,
  shippingAddress: { line1: string; city: string; postalCode: string; country: string },
  orderNumber?: number | null,
  discountCode?: string | null,
  discountPercent?: number | null,
  shippingMethod?: string | null,
): string {
  const isExpress = shippingMethod === 'express';
  const trackingDays = isExpress ? '1 business day' : '2 business days';
  const shippingCopy = isExpress
    ? 'Express Shipping via DHL<br>Worldwide: 2&ndash;4 business days'
    : 'Shipping via DHL<br>EU &amp; UK: 4&ndash;6 business days &middot; Rest of World: 6&ndash;8 business days';
  const year = new Date().getFullYear();
  const orderNumSection = orderNumber
    ? `<p style="font-size: 13px; color: #999; margin: 0 0 8px 0;">Order Number: <strong style="color: #1a1a1a; font-size: 15px;">#${orderNumber}</strong></p>`
    : "";
  const addressParts = [shippingAddress.line1, shippingAddress.city, shippingAddress.postalCode, shippingAddress.country].filter(Boolean);
  const shippingSection = addressParts.length > 0 ? `
    <div style="padding: 0 32px 24px 32px;">
      <div style="background-color: #faf9f6; border: 1px solid #eee; padding: 20px 24px; border-radius: 8px;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 12px 0;">Shipping Address</p>
        ${shippingAddress.line1 ? `<p style="font-size: 14px; color: #333; margin: 0 0 4px 0; line-height: 1.5;">${shippingAddress.line1}</p>` : ""}
        ${shippingAddress.city || shippingAddress.postalCode ? `<p style="font-size: 14px; color: #333; margin: 0 0 4px 0; line-height: 1.5;">${[shippingAddress.city, shippingAddress.postalCode].filter(Boolean).join(", ")}</p>` : ""}
        ${shippingAddress.country ? `<p style="font-size: 14px; color: #333; margin: 0; line-height: 1.5;">${shippingAddress.country}</p>` : ""}
      </div>
    </div>` : "";

  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>',
    '<body style="margin: 0; padding: 0; background-color: #f4f3ef; font-family: Helvetica Neue, Arial, sans-serif;">',
    '<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">',

    '<div style="background-color: #1a1a1a; padding: 36px 32px; text-align: center;">',
    '<h1 style="color: #c9a96e; font-size: 26px; font-weight: 300; letter-spacing: 5px; margin: 0; text-transform: uppercase;">Parfumistry</h1>',
    '<p style="color: #666; font-size: 12px; letter-spacing: 2px; margin: 8px 0 0 0; text-transform: uppercase;">Premium Fragrances</p>',
    '</div>',

    '<div style="background: linear-gradient(135deg, #c9a96e 0%, #b8944f 100%); padding: 28px 32px; text-align: center;">',
    '<h2 style="color: #ffffff; font-size: 22px; font-weight: 400; margin: 0; letter-spacing: 1px;">Your Order Has Been Confirmed! &#127881;</h2>',
    '</div>',

    '<div style="background-color: #1a1a1a; padding: 28px 32px; text-align: center; border-bottom: 3px solid #c9a96e;">',
    '<h2 style="color: #c9a96e; font-size: 22px; font-weight: 600; margin: 0 0 6px 0; letter-spacing: 1px;">Thank you for your purchase!</h2>',
    '<h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 14px 0;">&#127873; Special Offer!</h2>',
    '<p style="color: #ffffff; font-size: 16px; margin: 0 0 6px 0; line-height: 1.5;">Use code <span style="background-color: #c9a96e; color: #1a1a1a; padding: 3px 10px; border-radius: 4px; font-weight: 700; font-size: 18px; letter-spacing: 1px;">Parfumz50</span> for <strong>50% off</strong> your next order</p>',
    '<p style="color: #ccc; font-size: 13px; margin: 8px 0 0 0; line-height: 1.5;">Valid for 24 hours only &#9200;<br><span style="color: #bbb; font-size: 13px;">(Valid for short time only in order to avoid order hoarding. Code can be used for multiple orders)</span></p>',
    '</div>',

    '<div style="padding: 32px 32px 0 32px;">',
    orderNumSection,
    '<p style="font-size: 15px; color: #333; margin: 0 0 6px 0; line-height: 1.6;">Hi <strong>' + escapeHtml(customerName) + '</strong>,</p>',
    '<div style="background-color: #faf9f6; border: 2px solid #c9a96e; padding: 16px 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">',
    '<p style="font-size: 16px; color: #1a1a1a; margin: 0; font-weight: 500; line-height: 1.6;">📦 Your order has been confirmed and is being prepared for shipment. You will receive your <strong>DHL</strong> tracking number within <strong>' + trackingDays + '</strong>.</p>',
    '</div>',
    '</div>',

    '<div style="padding: 0 32px;">',
    '<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #999; padding-bottom: 12px; border-bottom: 2px solid #1a1a1a; margin-bottom: 0;">Your Products</div>',
    '<table style="width: 100%; border-collapse: collapse;"><tbody>',
    itemsHtml,
    '</tbody></table></div>',

    ...(discountCode && discountPercent ? [
    '<div style="padding: 0 32px; text-align: right;">',
    '<span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #999;">Discount: </span>',
    '<span style="font-size: 15px; font-weight: 500; color: #c9a96e;">' + escapeHtml(discountCode || '') + ' (' + discountPercent + '% off)</span>',
    '</div>',
    ] : []),

    '<div style="padding: 20px 32px; margin: 0 32px; border-top: 2px solid #1a1a1a; text-align: right;">',
    '<span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #999;">Total Paid: </span>',
    '<span style="font-size: 22px; font-weight: 600; color: #1a1a1a;">&euro;' + totalAmount + '</span>',
    '</div>',

    shippingSection,

    '<div style="padding: 0 32px; margin-bottom: 24px;">',
    '<div style="background-color: #f0f7f0; border: 1px solid #d4e8d4; padding: 16px 24px; border-radius: 8px; text-align: center;">',
    '<p style="font-size: 14px; color: #2d6a2d; margin: 0; font-weight: 500;">&#128666; ' + shippingCopy + '</p>',
    '</div></div>',

    '<div style="padding: 0 32px 32px 32px;">',
    '<div style="background-color: #faf9f6; border: 1px solid #eee; padding: 20px 24px; border-radius: 8px; text-align: center;">',
    '<p style="font-size: 13px; color: #666; margin: 0; line-height: 1.6;">Questions about your order? Contact us at<br>',
    '<a href="mailto:support@parfumistry.net" style="color: #c9a96e; text-decoration: none; font-weight: 500;">support@parfumistry.net</a>' + (orderNumber ? '<br><span style="font-size: 12px; color: #999;">Please include your order number: <strong>#' + orderNumber + '</strong></span>' : '') + '</p>',
    '</div></div>',

    '<div style="background-color: #1a1a1a; padding: 28px 32px; text-align: center;">',
    '<p style="color: #c9a96e; font-size: 14px; letter-spacing: 3px; margin: 0 0 8px 0; text-transform: uppercase;">Parfumistry</p>',
    '<p style="color: #666; font-size: 11px; margin: 0; line-height: 1.8;">&copy; ' + year + ' Parfumistry. All rights reserved.<br>',
    '<a href="https://parfumistry.net" style="color: #888; text-decoration: none;">parfumistry.net</a></p>',
    '</div>',

    '</div></body></html>',
  ].join("\n");
}

const ADMIN_EMAIL = "ewhz3384@gmail.com";

function buildAdminInvoiceHtml(
  customerName: string,
  customerEmail: string,
  items: OrderItem[],
  totalAmount: string,
  billingAddress: { line1: string; city: string; postalCode: string; country: string },
  paymentMethod: string,
  discountCode?: string | null,
  discountPercent?: number | null,
): string {
  const year = new Date().getFullYear();
  const now = new Date();
  const orderDate = now.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Amsterdam" });
  const invoiceNo = "INV-" + now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "-" + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + String(now.getSeconds()).padStart(2, "0");
  const addressText = [billingAddress.line1, billingAddress.city, billingAddress.postalCode, billingAddress.country].filter(Boolean).join(", ") || "N/A";

  const itemRows = items.map((item, i) => {
    const mlLabel = item.selectedMl ? ` — ${item.selectedMl}ml` : "";
    const lineTotal = (item.price * item.quantity).toFixed(2);
    const isSample = item.price === 0 || /sample/i.test(item.name);
    const cleanName = item.name.replace(/\s*[—-]\s*Free\s*2ml\s*Sample\s*🎁?/i, '').trim();
    const bg = isSample ? "#fdf8ee" : (i % 2 === 0 ? "#ffffff" : "#fafaf8");
    const productLink = getProductLink(cleanName, item.brand, item.affiliateUrl);
    const sampleTag = isSample
      ? `<span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#1a1a1a;background:#c9a96e;padding:2px 6px;border-radius:3px;margin-right:6px;">FREE SAMPLE 🎁</span>`
      : '';
    const priceCell = isSample ? `<span style="color:#c9a96e;font-weight:600;">FREE</span>` : `€${item.price.toFixed(2)}`;
    const totalCell = isSample ? `<span style="color:#c9a96e;font-weight:600;">€0.00</span>` : `€${lineTotal}`;
    return `<tr style="background:${bg};">
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;color:#333;">${sampleTag}${item.brand} — ${cleanName}${mlLabel} <a href="${productLink}" style="color:#c9a96e;font-weight:500;text-decoration:none;">(link)</a></td>
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;text-align:center;color:#333;">${item.quantity}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;text-align:right;color:#333;">${priceCell}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;text-align:right;color:#333;font-weight:500;">${totalCell}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f4f3ef;font-family:Helvetica Neue,Arial,sans-serif;">
<div style="max-width:680px;margin:0 auto;background:#fff;border-radius:0;overflow:hidden;border:1px solid #e8e5df;">

  <!-- Header -->
  <div style="background:#1a1a1a;padding:32px 40px;display:flex;justify-content:space-between;">
    <table style="width:100%;"><tr>
      <td style="vertical-align:top;">
        <h1 style="color:#c9a96e;font-size:24px;font-weight:300;letter-spacing:5px;margin:0;text-transform:uppercase;">Parfumistry</h1>
        <p style="color:#666;font-size:11px;letter-spacing:2px;margin:6px 0 0;text-transform:uppercase;">Premium Fragrances</p>
      </td>
      <td style="vertical-align:top;text-align:right;">
        <p style="color:#c9a96e;font-size:20px;font-weight:300;letter-spacing:3px;margin:0;text-transform:uppercase;">Invoice</p>
      </td>
    </tr></table>
  </div>

  <!-- Invoice Meta -->
  <div style="padding:28px 40px 0;border-bottom:1px solid #f0ede8;">
    <table style="width:100%;margin-bottom:24px;">
      <tr>
        <td style="vertical-align:top;width:50%;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;margin:0 0 6px;">Bill To</p>
          <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px;">${escapeHtml(customerName)}</p>
          <p style="font-size:13px;color:#666;margin:0 0 2px;">${escapeHtml(customerEmail)}</p>
          <p style="font-size:13px;color:#666;margin:0;">${escapeHtml(addressText)}</p>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <table style="margin-left:auto;">
            <tr><td style="padding:2px 0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#999;padding-right:12px;">Invoice No.</td><td style="padding:2px 0;font-size:13px;color:#1a1a1a;font-weight:500;">${invoiceNo}</td></tr>
            <tr><td style="padding:2px 0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#999;padding-right:12px;">Date</td><td style="padding:2px 0;font-size:13px;color:#1a1a1a;">${orderDate}</td></tr>
            <tr><td style="padding:2px 0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#999;padding-right:12px;">Payment</td><td style="padding:2px 0;font-size:13px;color:#1a1a1a;font-weight:500;">${paymentMethod}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </div>

  <!-- Items Table -->
  <div style="padding:24px 40px;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#1a1a1a;">
          <th style="padding:10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a96e;font-weight:500;">Description</th>
          <th style="padding:10px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a96e;font-weight:500;">Qty</th>
          <th style="padding:10px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a96e;font-weight:500;">Unit Price</th>
          <th style="padding:10px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a96e;font-weight:500;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Totals -->
    <table style="width:100%;margin-top:0;">
      <tr>
        <td style="width:60%;"></td>
        <td style="padding:16px 10px 6px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#999;">Subtotal</td>
        <td style="padding:16px 10px 6px;text-align:right;font-size:14px;color:#333;">€${totalAmount}</td>
      </tr>
      ${discountCode && discountPercent ? `<tr>
        <td></td>
        <td style="padding:6px 10px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#c9a96e;font-weight:600;">Discount (${discountCode})</td>
        <td style="padding:6px 10px;text-align:right;font-size:14px;color:#c9a96e;font-weight:600;">${discountPercent}% off</td>
      </tr>` : ''}
      <tr>
        <td></td>
        <td style="padding:6px 10px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#999;">Tax (0%)</td>
        <td style="padding:6px 10px;text-align:right;font-size:14px;color:#333;">€0.00</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding:12px 10px;text-align:right;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#1a1a1a;font-weight:700;border-top:2px solid #1a1a1a;">Total Due</td>
        <td style="padding:12px 10px;text-align:right;font-size:20px;color:#1a1a1a;font-weight:700;border-top:2px solid #1a1a1a;">€${totalAmount}</td>
      </tr>
    </table>
  </div>

  <!-- Notes -->
  <div style="padding:0 40px 28px;">
    <div style="background:#faf9f6;border-left:3px solid #c9a96e;padding:16px 20px;">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin:0 0 6px;font-weight:600;">Notes & Terms</p>
      <p style="font-size:12px;color:#666;margin:0;line-height:1.7;">Shipped via DHL. This invoice serves as proof of transaction for dispute purposes. Customer agreed to terms of service at checkout. All order timestamps and details are logged server-side.</p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#1a1a1a;padding:24px 40px;text-align:center;">
    <p style="color:#c9a96e;font-size:13px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;">Parfumistry</p>
    <p style="color:#666;font-size:11px;margin:0;line-height:1.6;">© ${year} Parfumistry. All rights reserved.<br>
    <a href="mailto:support@parfumistry.net" style="color:#888;text-decoration:none;">support@parfumistry.net</a></p>
  </div>

</div>
</body></html>`;
}

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Parfumistry <orders@parfumistry.net>",
      to: [to],
      subject,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error("Resend API error (" + res.status + "): " + errBody);
  }

  console.log("Email sent via Resend to:", to);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { orderItems, customerEmail, customerName, shippingAddress, totalAmount, orderNumber, paymentMethod, discountCode, discountPercent } = body as {
      orderItems: (OrderItem | { product: { name: string; brand: string; image: string; price: number }; quantity: number; selectedMl?: number; selectedPrice?: number })[];
      customerEmail: string;
      customerName: string;
      shippingAddress: { line1: string; city: string; postalCode: string; country: string };
      totalAmount: string;
      orderNumber?: number | null;
      paymentMethod?: string;
      discountCode?: string | null;
      discountPercent?: number | null;
    };

    if (!customerEmail) throw new Error("Customer email is required");
    if (!orderItems || orderItems.length === 0) throw new Error("No order items");

    const normalizedItems: OrderItem[] = orderItems.map((item: any) => {
      if (item.product) {
        return {
          name: item.product.name,
          brand: item.product.brand,
          image: item.product.image,
          price: item.selectedPrice || item.product.price,
          quantity: item.quantity,
          selectedMl: item.selectedMl,
          affiliateUrl: item.product.affiliateUrl || item.affiliateUrl,
          product_id: item.product.id || item.product_id,
        };
      }
      return item as OrderItem;
    });

    const calculatedTotal = totalAmount || normalizedItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);

    const paddingMap = await fetchPaddingOverrides(normalizedItems.map((i) => i.product_id || "").filter(Boolean));

    const origin = "https://parfumistry.net";
    const itemsHtml = buildItemsHtml(normalizedItems, origin, paddingMap);

    const shippingMethod = (shippingAddress as any)?.shippingMethod || null;
    const html = buildEmailHtml(customerName || "Valued Customer", itemsHtml, calculatedTotal, shippingAddress || { line1: "", city: "", postalCode: "", country: "" }, orderNumber, discountCode, discountPercent, shippingMethod);

    const emailSubject = orderNumber ? `Order #${orderNumber} Confirmed - Parfumistry` : "Order Confirmed - Parfumistry";
    await sendEmail(customerEmail, emailSubject, html);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending order confirmation:", error);
    return new Response(
      JSON.stringify({ error: "Unable to send confirmation" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
