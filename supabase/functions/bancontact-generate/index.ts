// Bancontact fake order generator. Creates a row in bancontact_orders and
// emails an approval message to elkhabirmalik with Approve / Reject / Split 50/50 links.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RECIPIENT = "ewhz3384@gmail.com";

interface BancItem {
  name: string;
  brand: string;
  price: number;
  quantity: number;
  selectedMl?: number;
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function genToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildEmailHtml(
  orderId: string,
  token: string,
  customerName: string,
  customerEmail: string,
  country: string | null,
  items: BancItem[],
  totalAmount: number,
  baseUrl: string,
): string {
  const approveUrl = `${baseUrl}/functions/v1/bancontact-action?id=${orderId}&token=${token}&action=approve`;
  const rejectUrl  = `${baseUrl}/functions/v1/bancontact-action?id=${orderId}&token=${token}&action=reject`;
  const splitUrl   = `${baseUrl}/functions/v1/bancontact-action?id=${orderId}&token=${token}&action=split`;

  const itemRows = items.map((item) => {
    const mlLabel = item.selectedMl ? ` — ${item.selectedMl}ml` : "";
    return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-family:Arial,sans-serif;">
      <strong>${escapeHtml(item.brand)}</strong> — ${escapeHtml(item.name)}${mlLabel}<br/>
      <span style="color:#666;">Qty: ${item.quantity} · €${(item.price * item.quantity).toFixed(2)}</span>
    </td></tr>`;
  }).join("");

  const countryRow = country
    ? `<tr><td style="padding:4px 0;color:#999;width:120px;">Country:</td><td style="padding:4px 0;">${escapeHtml(country)}</td></tr>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f4f3ef;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
  <div style="background:#1a1a1a;padding:24px;text-align:center;">
    <h1 style="color:#c9a96e;font-size:22px;margin:0;letter-spacing:3px;">BANCONTACT ORDER APPROVAL</h1>
  </div>
  <div style="padding:24px;">
    <p style="font-size:15px;color:#333;margin:0 0 16px;">A new Bancontact order needs your approval.</p>
    <table style="width:100%;margin-bottom:16px;font-size:14px;">
      <tr><td style="padding:4px 0;color:#999;width:120px;">Customer:</td><td style="padding:4px 0;"><strong>${escapeHtml(customerName)}</strong></td></tr>
      
      ${countryRow}
      <tr><td style="padding:4px 0;color:#999;">Total:</td><td style="padding:4px 0;"><strong>€${totalAmount.toFixed(2)}</strong></td></tr>
    </table>
    <div style="text-align:center;margin-top:24px;margin-bottom:12px;">
      <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;margin:4px;">Approve</a>
      <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;margin:4px;">Reject</a>
    </div>
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${splitUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 26px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Split 50/50 (half now, half in 1h)</a>
    </div>
    <div style="border-top:2px solid #1a1a1a;padding-top:12px;margin-bottom:16px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px;">Order Items</div>
      <table style="width:100%;">${itemRows}</table>
    </div>
  </div>
</div>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Parfumistry Bancontact <orders@parfumistry.net>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errBody}`);
  }
}

// Seed customer pool — taken from a real orders export. The bancontact
// generator picks exclusively from this list (NOT from the live orders
// table) so that the same vetted set of names/countries rotates through.
// Cycle behavior: pick from the customer(s) with the fewest prior bancontact
// uses. Once everyone has been used N times, the pool naturally jumbles and
// reuses (random pick among the new min-count tier).
const SEED_CUSTOMERS: Array<{ name: string; email: string; country: string; city: string }> = [
  { name: "Nora Foster", email: "nora.foster@example.com", country: "NL", city: "" },
  { name: "Rohan Mehta", email: "rohan.mehta@example.com", country: "PL", city: "" },
  { name: "Adam Scott", email: "adam.scott@example.com", country: "ES", city: "" },
  { name: "Isaac Donovan", email: "isaac.donovan@example.com", country: "GB", city: "" },
  { name: "Min Zhang", email: "min.zhang@example.com", country: "DE", city: "" },
  { name: "Miles Brooks", email: "miles.brooks@example.com", country: "GB", city: "" },
  { name: "Miles Scott", email: "miles.scott@example.com", country: "US", city: "" },
  { name: "Adam Collins", email: "adam.collins@example.com", country: "AU", city: "" },
  { name: "Caleb Brooks", email: "caleb.brooks@example.com", country: "US", city: "" },
  { name: "Leah Mercer", email: "leah.mercer@example.com", country: "PL", city: "" },
  { name: "Hannah Foster", email: "hannah.foster@example.com", country: "GB", city: "" },
  { name: "Sophie Bishop", email: "sophie.bishop@example.com", country: "AU", city: "" },
  { name: "Elliot Ward", email: "elliot.ward@example.com", country: "AU", city: "" },
  { name: "Milena Dimitrov", email: "milena.dimitrov@example.com", country: "GB", city: "" },
  { name: "Samuel Osei", email: "samuel.osei@example.com", country: "SE", city: "" },
  { name: "Clara Foster", email: "clara.foster@example.com", country: "ES", city: "" },
  { name: "Ethan Collins", email: "ethan.collins@example.com", country: "NL", city: "" },
  { name: "Anika Nair", email: "anika.nair@example.com", country: "CA", city: "" },
  { name: "Youssef Khalil", email: "youssef.khalil@example.com", country: "GB", city: "" },
  { name: "Naomi Ward", email: "naomi.ward@example.com", country: "SE", city: "" },
  { name: "Daniel Okafor", email: "daniel.okafor@example.com", country: "DE", city: "" },
  { name: "Min Xu", email: "min.xu@example.com", country: "NL", city: "" },
  { name: "Zoe Scott", email: "zoe.scott@example.com", country: "AU", city: "" },
  { name: "Elliot Turner", email: "elliot.turner@example.com", country: "AU", city: "" },
  { name: "Grace Mensah", email: "grace.mensah@example.com", country: "AU", city: "" },
  { name: "Petar Markovic", email: "petar.markovic@example.com", country: "US", city: "" },
  { name: "Julian Briggs", email: "julian.briggs@example.com", country: "ES", city: "" },
  { name: "Julian Vaughn", email: "julian.vaughn@example.com", country: "CA", city: "" },
  { name: "Sophie Mercer", email: "sophie.mercer@example.com", country: "SE", city: "" },
  { name: "Elliot Bishop", email: "elliot.bishop@example.com", country: "AU", city: "" },
  { name: "Petar Jankovic", email: "petar.jankovic@example.com", country: "CA", city: "" },
  { name: "Isaac Price", email: "isaac.price@example.com", country: "SE", city: "" },
  { name: "Maya Collins", email: "maya.collins@example.com", country: "CA", city: "" },
  { name: "Hannah Price", email: "hannah.price@example.com", country: "DE", city: "" },
  { name: "Esther Adebayo", email: "esther.adebayo@example.com", country: "ES", city: "" },
  { name: "Miles Vaughn", email: "miles.vaughn@example.com", country: "SE", city: "" },
  { name: "Naomi Reeves", email: "naomi.reeves@example.com", country: "GB", city: "" },
  { name: "Adam Briggs", email: "adam.briggs@example.com", country: "PL", city: "" },
  { name: "Amina Osei", email: "amina.osei@example.com", country: "GB", city: "" },
  { name: "Nora Reeves", email: "nora.reeves@example.com", country: "AU", city: "" },
  { name: "Daniel Wong", email: "daniel.wong@example.com", country: "ES", city: "" },
  { name: "Priya Patel", email: "priya.patel@example.com", country: "AU", city: "" },
  { name: "Anika Patel", email: "anika.patel@example.com", country: "FR", city: "" },
  { name: "Hannah Turner", email: "hannah.turner@example.com", country: "SE", city: "" },
  { name: "Adam Price", email: "adam.price@example.com", country: "DE", city: "" },
  { name: "Omar Bakri", email: "omar.bakri@example.com", country: "DE", city: "" },
  { name: "Youssef Khalil", email: "youssef.khalil@example.com", country: "FR", city: "" },
  { name: "Miles Barrett", email: "miles.barrett@example.com", country: "ES", city: "" },
  { name: "Arjun Sharma", email: "arjun.sharma@example.com", country: "DE", city: "" },
  { name: "Elliot Parker", email: "elliot.parker@example.com", country: "ES", city: "" },
  { name: "Elliot Sutton", email: "elliot.sutton@example.com", country: "US", city: "" },
  { name: "Hannah Briggs", email: "hannah.briggs@example.com", country: "US", city: "" },
  { name: "Maya Brooks", email: "maya.brooks@example.com", country: "NL", city: "" },
  { name: "Hannah Hughes", email: "hannah.hughes@example.com", country: "SE", city: "" },
  { name: "Hannah Reeves", email: "hannah.reeves@example.com", country: "US", city: "" },
  { name: "Zoe Bishop", email: "zoe.bishop@example.com", country: "DE", city: "" },
  { name: "Naomi Reeves", email: "naomi.reeves@example.com", country: "NL", city: "" },
  { name: "Samuel Osei", email: "samuel.osei@example.com", country: "ES", city: "" },
  { name: "Isaac Turner", email: "isaac.turner@example.com", country: "NL", city: "" },
  { name: "Connor Ward", email: "connor.ward@example.com", country: "AU", city: "" },
  { name: "Owen Bishop", email: "owen.bishop@example.com", country: "NL", city: "" },
  { name: "Connor Barrett", email: "connor.barrett@example.com", country: "AU", city: "" },
  { name: "Adam Parker", email: "adam.parker@example.com", country: "SE", city: "" },
  { name: "Emmanuel Adebayo", email: "emmanuel.adebayo@example.com", country: "GB", city: "" },
  { name: "Amira Benali", email: "amira.benali@example.com", country: "NL", city: "" },
  { name: "Rami Khalil", email: "rami.khalil@example.com", country: "CA", city: "" },
  { name: "Leah Vaughn", email: "leah.vaughn@example.com", country: "AU", city: "" },
  { name: "Leah Reeves", email: "leah.reeves@example.com", country: "CA", city: "" },
  { name: "Sophie Briggs", email: "sophie.briggs@example.com", country: "SE", city: "" },
  { name: "Adam Mercer", email: "adam.mercer@example.com", country: "DE", city: "" },
  { name: "Ryan Chen", email: "ryan.chen@example.com", country: "NL", city: "" },
  { name: "Rami Mansour", email: "rami.mansour@example.com", country: "NL", city: "" },
  { name: "Esther Mwangi", email: "esther.mwangi@example.com", country: "NL", city: "" },
  { name: "Connor Mercer", email: "connor.mercer@example.com", country: "PL", city: "" },
  { name: "Joseph Okafor", email: "joseph.okafor@example.com", country: "PL", city: "" },
  { name: "Elliot Briggs", email: "elliot.briggs@example.com", country: "GB", city: "" },
  { name: "Ruby Foster", email: "ruby.foster@example.com", country: "ES", city: "" },
  { name: "Amina Diallo", email: "amina.diallo@example.com", country: "PL", city: "" },
  { name: "Clara Vaughn", email: "clara.vaughn@example.com", country: "CA", city: "" },
  { name: "Anika Khan", email: "anika.khan@example.com", country: "DE", city: "" },
  { name: "Isaac Turner", email: "isaac.turner@example.com", country: "AU", city: "" },
  { name: "Isaac Collins", email: "isaac.collins@example.com", country: "GB", city: "" },
  { name: "Miles Foster", email: "miles.foster@example.com", country: "SE", city: "" },
  { name: "Isaac Hughes", email: "isaac.hughes@example.com", country: "DE", city: "" },
  { name: "Jakub Markovic", email: "jakub.markovic@example.com", country: "SE", city: "" },
  { name: "Karim Hamdan", email: "karim.hamdan@example.com", country: "ES", city: "" },
  { name: "Rahul Reddy", email: "rahul.reddy@example.com", country: "DE", city: "" },
  { name: "Nikolai Markovic", email: "nikolai.markovic@example.com", country: "GB", city: "" },
  { name: "Milan Jankovic", email: "milan.jankovic@example.com", country: "ES", city: "" },
  { name: "Clara Hale", email: "clara.hale@example.com", country: "GB", city: "" },
  { name: "Naomi Barrett", email: "naomi.barrett@example.com", country: "AU", city: "" },
  { name: "Joseph Okafor", email: "joseph.okafor@example.com", country: "PL", city: "" },
  { name: "Emmanuel Diallo", email: "emmanuel.diallo@example.com", country: "PL", city: "" },
  { name: "Owen Turner", email: "owen.turner@example.com", country: "GB", city: "" },
  { name: "Sophie Price", email: "sophie.price@example.com", country: "FR", city: "" },
  { name: "Hannah Bishop", email: "hannah.bishop@example.com", country: "CA", city: "" },
  { name: "Connor Reeves", email: "connor.reeves@example.com", country: "FR", city: "" },
  { name: "Amina Osei", email: "amina.osei@example.com", country: "FR", city: "" },
  { name: "Kevin Chen", email: "kevin.chen@example.com", country: "FR", city: "" },
  { name: "Ryan Kim", email: "ryan.kim@example.com", country: "US", city: "" },
  { name: "Avery Turner", email: "avery.turner@example.com", country: "SE", city: "" },
  { name: "Tomasz Stoyanov", email: "tomasz.stoyanov@example.com", country: "AU", city: "" },
  { name: "Omar Farah", email: "omar.farah@example.com", country: "PL", city: "" },
  { name: "Sami Haddad", email: "sami.haddad@example.com", country: "CA", city: "" },
  { name: "Rami Hamdan", email: "rami.hamdan@example.com", country: "AU", city: "" },
  { name: "Julian Barrett", email: "julian.barrett@example.com", country: "NL", city: "" },
  { name: "Leah Scott", email: "leah.scott@example.com", country: "SE", city: "" },
  { name: "Naomi Briggs", email: "naomi.briggs@example.com", country: "ES", city: "" },
  { name: "Miles Scott", email: "miles.scott@example.com", country: "PL", city: "" },
  { name: "Hannah Chen", email: "hannah.chen@example.com", country: "FR", city: "" },
  { name: "Joseph Ndlovu", email: "joseph.ndlovu@example.com", country: "FR", city: "" },
  { name: "Isaac Reeves", email: "isaac.reeves@example.com", country: "SE", city: "" },
  { name: "Adam Ward", email: "adam.ward@example.com", country: "SE", city: "" },
  { name: "Lucas Reeves", email: "lucas.reeves@example.com", country: "SE", city: "" },
  { name: "Amira Benali", email: "amira.benali@example.com", country: "GB", city: "" },
  { name: "Nour Rahman", email: "nour.rahman@example.com", country: "DE", city: "" },
  { name: "Anika Singh", email: "anika.singh@example.com", country: "PL", city: "" },
  { name: "Leah Turner", email: "leah.turner@example.com", country: "DE", city: "" },
  { name: "David Adebayo", email: "david.adebayo@example.com", country: "US", city: "" },
  { name: "Hannah Wong", email: "hannah.wong@example.com", country: "ES", city: "" },
  { name: "Clara Price", email: "clara.price@example.com", country: "PL", city: "" },
  { name: "Milan Stoyanov", email: "milan.stoyanov@example.com", country: "CA", city: "" },
  { name: "Arjun Kapoor", email: "arjun.kapoor@example.com", country: "US", city: "" },
  { name: "Stefan Petrov", email: "stefan.petrov@example.com", country: "GB", city: "" },
  { name: "Petar Kovac", email: "petar.kovac@example.com", country: "PL", city: "" },
  { name: "Ivana Dimitrov", email: "ivana.dimitrov@example.com", country: "SE", city: "" },
  { name: "Isaac Foster", email: "isaac.foster@example.com", country: "PL", city: "" },
  { name: "Leah Scott", email: "leah.scott@example.com", country: "AU", city: "" },
  { name: "Amina Ndlovu", email: "amina.ndlovu@example.com", country: "CA", city: "" },
  { name: "Caleb Donovan", email: "caleb.donovan@example.com", country: "ES", city: "" },
  { name: "Caleb Bishop", email: "caleb.bishop@example.com", country: "AU", city: "" },
  { name: "Sophie Ward", email: "sophie.ward@example.com", country: "DE", city: "" },
  { name: "Arjun Kapoor", email: "arjun.kapoor@example.com", country: "FR", city: "" },
  { name: "Avery Parker", email: "avery.parker@example.com", country: "DE", city: "" },
  { name: "Ruby Turner", email: "ruby.turner@example.com", country: "ES", city: "" },
  { name: "Milan Jankovic", email: "milan.jankovic@example.com", country: "CA", city: "" },
  { name: "Priya Reddy", email: "priya.reddy@example.com", country: "NL", city: "" },
  { name: "Arjun Singh", email: "arjun.singh@example.com", country: "CA", city: "" },
  { name: "Ivana Ivanov", email: "ivana.ivanov@example.com", country: "ES", city: "" },
  { name: "Nikolai Nowak", email: "nikolai.nowak@example.com", country: "US", city: "" },
  { name: "Naomi Foster", email: "naomi.foster@example.com", country: "AU", city: "" },
  { name: "Clara Bishop", email: "clara.bishop@example.com", country: "NL", city: "" },
  { name: "Karan Khan", email: "karan.khan@example.com", country: "FR", city: "" },
  { name: "Leah Price", email: "leah.price@example.com", country: "AU", city: "" },
  { name: "Rami Hamdan", email: "rami.hamdan@example.com", country: "NL", city: "" },
  { name: "Aleksandar Dimitrov", email: "aleksandar.dimitrov@example.com", country: "FR", city: "" },
  { name: "Karan Reddy", email: "karan.reddy@example.com", country: "AU", city: "" },
  { name: "Vivek Kapoor", email: "vivek.kapoor@example.com", country: "CA", city: "" },
  { name: "Miles Barrett", email: "miles.barrett@example.com", country: "FR", city: "" },
  { name: "Julian Reeves", email: "julian.reeves@example.com", country: "ES", city: "" },
  { name: "Tomasz Petrov", email: "tomasz.petrov@example.com", country: "ES", city: "" },
  { name: "Miles Turner", email: "miles.turner@example.com", country: "US", city: "" },
  { name: "Simran Sharma", email: "simran.sharma@example.com", country: "US", city: "" },
  { name: "Hannah Lee", email: "hannah.lee@example.com", country: "CA", city: "" },
  { name: "Rahul Bhat", email: "rahul.bhat@example.com", country: "SE", city: "" },
  { name: "Ethan Vaughn", email: "ethan.vaughn@example.com", country: "US", city: "" },
  { name: "Ethan Foster", email: "ethan.foster@example.com", country: "AU", city: "" },
  { name: "Amina Okafor", email: "amina.okafor@example.com", country: "GB", city: "" },
  { name: "Clara Reeves", email: "clara.reeves@example.com", country: "FR", city: "" },
  { name: "Samuel Mwangi", email: "samuel.mwangi@example.com", country: "CA", city: "" },
  { name: "Jakub Dimitrov", email: "jakub.dimitrov@example.com", country: "AU", city: "" },
  { name: "Isaac Bishop", email: "isaac.bishop@example.com", country: "SE", city: "" },
  { name: "Stefan Dimitrov", email: "stefan.dimitrov@example.com", country: "AU", city: "" },
  { name: "Sophie Scott", email: "sophie.scott@example.com", country: "PL", city: "" },
  { name: "Amira Nasser", email: "amira.nasser@example.com", country: "PL", city: "" },
  { name: "Karan Malhotra", email: "karan.malhotra@example.com", country: "US", city: "" },
  { name: "Avery Brooks", email: "avery.brooks@example.com", country: "GB", city: "" },
  { name: "Adam Hughes", email: "adam.hughes@example.com", country: "GB", city: "" },
  { name: "Tarek Mansour", email: "tarek.mansour@example.com", country: "ES", city: "" },
  { name: "Naomi Bishop", email: "naomi.bishop@example.com", country: "DE", city: "" },
  { name: "Caleb Hale", email: "caleb.hale@example.com", country: "US", city: "" },
  { name: "Ethan Turner", email: "ethan.turner@example.com", country: "ES", city: "" },
  { name: "Tomasz Popescu", email: "tomasz.popescu@example.com", country: "ES", city: "" },
  { name: "Avery Reeves", email: "avery.reeves@example.com", country: "NL", city: "" },
  { name: "Maya Mercer", email: "maya.mercer@example.com", country: "PL", city: "" },
  { name: "Elliot Bishop", email: "elliot.bishop@example.com", country: "SE", city: "" },
  { name: "David Adebayo", email: "david.adebayo@example.com", country: "SE", city: "" },
  { name: "Isaac Hale", email: "isaac.hale@example.com", country: "GB", city: "" },
  { name: "Amina Osei", email: "amina.osei@example.com", country: "GB", city: "" },
  { name: "Katarina Stoyanov", email: "katarina.stoyanov@example.com", country: "FR", city: "" },
  { name: "Ethan Bishop", email: "ethan.bishop@example.com", country: "CA", city: "" },
  { name: "Caleb Ward", email: "caleb.ward@example.com", country: "AU", city: "" },
  { name: "Avery Sutton", email: "avery.sutton@example.com", country: "GB", city: "" },
  { name: "Sami Haddad", email: "sami.haddad@example.com", country: "SE", city: "" },
  { name: "Milan Stoyanov", email: "milan.stoyanov@example.com", country: "AU", city: "" },
  { name: "Naomi Price", email: "naomi.price@example.com", country: "PL", city: "" },
  { name: "Hannah Reeves", email: "hannah.reeves@example.com", country: "SE", city: "" },
  { name: "Elliot Donovan", email: "elliot.donovan@example.com", country: "FR", city: "" },
  { name: "Elliot Hughes", email: "elliot.hughes@example.com", country: "US", city: "" },
  { name: "Layla Saleh", email: "layla.saleh@example.com", country: "GB", city: "" },
  { name: "Isaac Collins", email: "isaac.collins@example.com", country: "SE", city: "" },
  { name: "Milena Markovic", email: "milena.markovic@example.com", country: "NL", city: "" },
  { name: "Naomi Collins", email: "naomi.collins@example.com", country: "FR", city: "" },
  { name: "Isaac Foster", email: "isaac.foster@example.com", country: "NL", city: "" },
  { name: "Anika Nair", email: "anika.nair@example.com", country: "DE", city: "" },
  { name: "Michelle Park", email: "michelle.park@example.com", country: "DE", city: "" },
  { name: "Avery Nolan", email: "avery.nolan@example.com", country: "SE", city: "" },
  { name: "Connor Brooks", email: "connor.brooks@example.com", country: "FR", city: "" },
  { name: "Ivana Kovac", email: "ivana.kovac@example.com", country: "SE", city: "" },
  { name: "Leah Turner", email: "leah.turner@example.com", country: "NL", city: "" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function emailFor(seed: { name: string; email: string }): string {
  if (seed.email && seed.email.includes("@")) return seed.email;
  const slug = slugify(seed.name) || "customer";
  return `${slug}@customer.local`;
}

type PickResult = {
  ok: true;
  name: string;
  email: string;
  country: string | null;
  exhausted: boolean;
  poolSize: number;
};

async function pickCustomer(
  supabase: ReturnType<typeof createClient>,
  source: "seed" | "history" = "seed",
): Promise<PickResult> {
  // Pull past bancontact orders both to tally usage AND (for "history" mode)
  // to source the pool of names. Ordered newest-first so we can track recency.
  const { data: prev } = await supabase
    .from("bancontact_orders")
    .select("customer_name, customer_email, country, created_at")
    .order("created_at", { ascending: false });
  const counts = new Map<string, number>();
  const lastUsedIdx = new Map<string, number>(); // 0 = most recent (within bancontact only)
  const historyMap = new Map<string, { name: string; email: string; country: string }>();
  const rows = (prev || []) as Array<{ customer_name: string | null; customer_email: string | null; country: string | null; created_at: string | null }>;
  rows.forEach((r, idx) => {
    const k = (r.customer_name || "").trim().toLowerCase();
    if (!k) return;
    counts.set(k, (counts.get(k) ?? 0) + 1);
    if (!lastUsedIdx.has(k)) lastUsedIdx.set(k, idx);
    if (!historyMap.has(k)) {
      historyMap.set(k, {
        name: r.customer_name || "",
        email: r.customer_email || "",
        country: r.country || "",
      });
    }
  });

  // For "history" mode, ALSO pull every customer that ever placed a regular order
  // so the pool spans the entire site's order history — not just bancontact.
  if (source === "history") {
    const { data: regular } = await supabase
      .from("orders")
      .select("customer_name, customer_email, shipping_address")
      .not("customer_name", "is", null);
    const regRows = (regular || []) as Array<{ customer_name: string | null; customer_email: string | null; shipping_address: any }>;
    for (const r of regRows) {
      const name = (r.customer_name || "").trim();
      if (!name) continue;
      const k = name.toLowerCase();
      if (historyMap.has(k)) continue;
      const country =
        (r.shipping_address && (r.shipping_address.country || r.shipping_address.Country)) || "";
      historyMap.set(k, {
        name,
        email: r.customer_email || "",
        country: String(country || ""),
      });
    }
  }

  // Choose the pool based on source.
  let pool: Array<{ name: string; email: string; country: string }>;
  if (source === "history") {
    pool = Array.from(historyMap.values());
    if (pool.length === 0) {
      // Fallback to seed pool if no history exists yet.
      pool = SEED_CUSTOMERS.map((s) => ({ name: s.name, email: s.email, country: s.country }));
    }
  } else {
    pool = SEED_CUSTOMERS.map((s) => ({ name: s.name, email: s.email, country: s.country }));
  }

  // Exclude recently-used names so we never reuse one that just appeared.
  // Window scales with pool size but is bounded.
  const recentWindow = Math.min(Math.max(20, Math.floor(pool.length * 0.5)), Math.max(0, pool.length - 1));
  let candidates = pool.filter((s) => {
    const idx = lastUsedIdx.get(s.name.toLowerCase());
    return idx === undefined || idx >= recentWindow;
  });
  if (candidates.length === 0) candidates = pool;

  // Find the minimum usage count across the candidates, then pick at random
  // from everyone tied at that minimum. When everyone is at >=1 we've
  // "exhausted" one full cycle and naturally jumble + reuse from there.
  let minCount = Infinity;
  for (const s of candidates) {
    const c = counts.get(s.name.toLowerCase()) ?? 0;
    if (c < minCount) minCount = c;
  }
  if (minCount === Infinity) minCount = 0;
  const tier = candidates.filter(
    (s) => (counts.get(s.name.toLowerCase()) ?? 0) === minCount,
  );
  const chosen = pick(tier);

  return {
    ok: true,
    name: chosen.name,
    email: emailFor(chosen),
    country: chosen.country || null,
    exhausted: minCount >= 1,
    poolSize: pool.length,
  };
}


async function buildRandomItems(supabase: ReturnType<typeof createClient>): Promise<{ items: BancItem[]; total: number }> {
  // Pull a wide pool of past order items to draw from.
  const { data } = await supabase
    .from("orders")
    .select("order_items")
    .neq("status", "pending_approval")
    .order("created_at", { ascending: false })
    .limit(150);
  const pool: BancItem[] = [];
  for (const row of (data || []) as Array<{ order_items: any }>) {
    const arr = Array.isArray(row.order_items) ? row.order_items : [];
    for (const it of arr) {
      if (!it || typeof it !== "object") continue;
      const price = Number(it.price);
      if (!isFinite(price) || price <= 0 || price > 120) continue;
      pool.push({
        name: String(it.name || "Fragrance"),
        brand: String(it.brand || "Brand"),
        price,
        quantity: 1,
        selectedMl: typeof it.selectedMl === "number" ? it.selectedMl : undefined,
      });
    }
  }
  // Fallback pool if no items
  if (pool.length === 0) {
    pool.push(
      { name: "Aventus", brand: "Creed", price: 49.99, quantity: 1, selectedMl: 50 },
      { name: "Sauvage", brand: "Dior", price: 39.99, quantity: 1, selectedMl: 100 },
      { name: "Eros", brand: "Versace", price: 34.99, quantity: 1, selectedMl: 100 },
    );
  }

  // Try up to 15 random compositions, pick the first whose total is 20-150.
  for (let attempt = 0; attempt < 15; attempt++) {
    const count = 1 + Math.floor(Math.random() * 3); // 1..3
    const picked: BancItem[] = [];
    for (let i = 0; i < count; i++) {
      picked.push({ ...pick(pool) });
    }
    const total = picked.reduce((s, it) => s + it.price * it.quantity, 0);
    if (total >= 20 && total <= 150) {
      return { items: picked, total: Math.round(total * 100) / 100 };
    }
  }
  // Last resort: take a single cheap item from the pool.
  const cheap = pool
    .filter((it) => it.price >= 20 && it.price <= 100)
    .sort(() => Math.random() - 0.5)[0] || pool[0];
  return {
    items: [{ ...cheap, quantity: 1 }],
    total: Math.round(cheap.price * 100) / 100,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({} as any));
    const mode: "random" | "custom" = body?.mode === "custom" ? "custom" : "random";
    const source: string = body?.source === "timed" ? "timed" : mode;
    const customerSource: "seed" | "history" = body?.customerSource === "history" ? "history" : "seed";

    const pickRes = await pickCustomer(supabase, customerSource);
    const customer = { name: pickRes.name, email: pickRes.email, country: pickRes.country };

    let items: BancItem[];
    let total: number;

    if (mode === "custom") {
      const rawItems = Array.isArray(body?.items) ? body.items : [];
      if (rawItems.length === 0) {
        return new Response(JSON.stringify({ error: "Custom mode requires items." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }
      items = rawItems.map((it: any) => ({
        name: String(it.name || "Fragrance"),
        brand: String(it.brand || "Brand"),
        price: Number(it.price) || 0,
        quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
        selectedMl: typeof it.selectedMl === "number" ? it.selectedMl : undefined,
      }));
      const providedTotal = Number(body?.total);
      total = isFinite(providedTotal) && providedTotal > 0
        ? Math.round(providedTotal * 100) / 100
        : Math.round(items.reduce((s, it) => s + it.price * it.quantity, 0) * 100) / 100;
    } else {
      const built = await buildRandomItems(supabase);
      items = built.items;
      total = built.total;
    }

    const token = genToken();
    const { data: order, error: insErr } = await supabase
      .from("bancontact_orders")
      .insert({
        customer_name: customer.name,
        customer_email: customer.email,
        country: customer.country,
        order_items: items,
        total_amount: total,
        status: "pending",
        approval_token: token,
        source,
      })
      .select("id")
      .single();
    if (insErr || !order) throw new Error(`Failed to create bancontact order: ${insErr?.message}`);

    // Bancontact emails disabled — orders are auto-approved by the timer tick
    // 1–5 minutes after generation (deterministic per-order delay derived from id).
    void buildEmailHtml; void sendEmail; void RECIPIENT;

    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
      customer: customer.name,
      total,
      exhausted: pickRes.exhausted,
      poolSize: pickRes.poolSize,
      warning: pickRes.exhausted
        ? `Seed pool fully cycled (${pickRes.poolSize} customers). Reusing names from a jumbled rotation.`
        : undefined,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e: any) {
    console.error("bancontact-generate error:", e);
    return new Response(JSON.stringify({ error: e.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
