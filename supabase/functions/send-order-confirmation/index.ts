import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EMAIL_PRODUCT_IMAGES, type EmailProductImage } from "./product-images.ts";

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

const SITE_URL = "https://www.parfora.net";

// Strip accents for matching (é→e, ô→o, etc.)
function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(str: string): string {
  return stripAccents(str.toLowerCase()).replace(/[^a-z0-9]+/g, " ").trim();
}

// The JPG bundle has no single cover image on the site, so its email thumbnail is a hand-built composite.
const EXTRA_EMAIL_IMAGES: EmailProductImage[] = [
  { id: "jpg-bundle", name: 'Fragrance Bundle "The JPG Collection"', brand: "Parfora", path: "/email/products/jpg-bundle.png" },
];

const ALL_EMAIL_IMAGES = [...EMAIL_PRODUCT_IMAGES, ...EXTRA_EMAIL_IMAGES];
const EMAIL_IMAGE_BY_ID = new Map(ALL_EMAIL_IMAGES.map((e) => [e.id, e.path]));
// Longest names first so "Aventus Absolu" wins over "Aventus".
const EMAIL_IMAGE_BY_NAME = ALL_EMAIL_IMAGES
  .map((e) => ({ key: normalizeName(e.name), path: e.path }))
  .sort((a, b) => b.key.length - a.key.length);
const EMAIL_FALLBACK_IMAGE = "/email/parfora-mark.png";

function resolveProductImage(item: { name: string; product_id?: string }): string {
  const byId = item.product_id ? EMAIL_IMAGE_BY_ID.get(item.product_id) : undefined;
  if (byId) return SITE_URL + byId;
  const n = normalizeName(item.name.replace(/\s*[—-]\s*Free\s*2ml\s*Sample.*$/i, ""));
  const byName = EMAIL_IMAGE_BY_NAME.find((e) => n.includes(e.key));
  return SITE_URL + (byName ? byName.path : EMAIL_FALLBACK_IMAGE);
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
    return `<img src="${imageUrl}" alt="${escapeHtml(alt)}" width="${BOX}" height="${BOX}" style="display:block;width:${BOX}px;height:${BOX}px;border:0;outline:none;text-decoration:none;" />`;
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
  const imageUrl = resolveProductImage(item);
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
${showImage ? `<td style="width: 88px; vertical-align: top;">
<div style="width:72px;height:72px;padding:6px;border-radius:10px;border:1px solid #ece7dc;overflow:hidden;background-color:#f7f5f0;">
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
    '<a href="' + SITE_URL + '" style="text-decoration: none;"><img src="' + SITE_URL + '/email/parfora-mark.png" alt="" width="36" height="60" style="display: block; margin: 0 auto 14px auto; width: 36px; height: 60px; border: 0;" />',
    '<h1 style="color: #c9a96e; font-size: 26px; font-weight: 300; letter-spacing: 8px; margin: 0; text-transform: uppercase;">Parfora</h1></a>',
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
    '<p style="color: #c9a96e; font-size: 14px; letter-spacing: 3px; margin: 0 0 8px 0; text-transform: uppercase;">Parfora</p>',
    '<p style="color: #666; font-size: 11px; margin: 0; line-height: 1.8;">&copy; ' + year + ' Parfora. All rights reserved.<br>',
    '<a href="https://www.parfora.net" style="color: #888; text-decoration: none;">parfora.net</a></p>',
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
        <h1 style="color:#c9a96e;font-size:24px;font-weight:300;letter-spacing:5px;margin:0;text-transform:uppercase;">Parfora</h1>
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
    <p style="color:#c9a96e;font-size:13px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;">Parfora</p>
    <p style="color:#666;font-size:11px;margin:0;line-height:1.6;">© ${year} Parfora. All rights reserved.<br>
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
      from: "Parfora <orders@parfumistry.net>",
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

    const origin = "https://www.parfora.net";
    const itemsHtml = buildItemsHtml(normalizedItems, origin, paddingMap);

    const shippingMethod = (shippingAddress as any)?.shippingMethod || null;
    const html = buildEmailHtml(customerName || "Valued Customer", itemsHtml, calculatedTotal, shippingAddress || { line1: "", city: "", postalCode: "", country: "" }, orderNumber, discountCode, discountPercent, shippingMethod);

    const emailSubject = orderNumber ? `Order #${orderNumber} Confirmed - Parfora` : "Order Confirmed - Parfora";
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
