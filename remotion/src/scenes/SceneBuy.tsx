import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { BrowserChrome, Cursor, StepBadge } from "../components/Browser";

// G2A checkout — shows ALL the payment methods called out on the site:
// Visa, Mastercard, Apple Pay, Google Pay, Paysafecard, PayPal, & more.
export const SceneBuy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18 } });

  // First payment option center ≈ (460, 175). Pay button center ≈ (1248, 312).
  const optX = 460, optY = 175;
  const payX = 1248, payY = 312;
  const cx = interpolate(frame, [0, 30, 65, 95, 130], [1000, optX - 2, optX - 2, payX - 2, payX - 2], { extrapolateRight: "clamp" });
  const cy = interpolate(frame, [0, 30, 65, 95, 130], [600, optY - 2, optY - 2, payY - 2, payY - 2], { extrapolateRight: "clamp" });
  const selected = frame >= 32;
  const clickingPay = frame >= 95 && frame <= 108;
  const paying = frame >= 100;

  const methods: Array<{ label: string; render: () => React.ReactNode }> = [
    { label: "Credit / Debit card (Visa, Mastercard)", render: () => (
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ background: "#1A1F71", color: "#fff", padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 800 }}>VISA</div>
        <div style={{ width: 36, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, background: "#fff", border: "1px solid #eee", position: "relative" }}>
          <div style={{ position: "absolute", left: 6, width: 14, height: 14, borderRadius: 7, background: "#EB001B" }} />
          <div style={{ position: "absolute", right: 6, width: 14, height: 14, borderRadius: 7, background: "#F79E1B", mixBlendMode: "multiply" }} />
        </div>
      </div>
    )},
    { label: "PayPal", render: () => <span style={{ color: "#003087", fontWeight: 900, fontSize: 18 }}>Pay<span style={{ color: "#0070ba" }}>Pal</span></span> },
    { label: "Apple Pay", render: () => <span style={{ color: "#111", fontWeight: 600, fontSize: 14 }}> Pay</span> },
    { label: "Google Pay", render: () => <span style={{ color: "#5f6368", fontWeight: 700, fontSize: 14 }}>G Pay</span> },
    { label: "Paysafecard", render: () => <span style={{ background: "#0096d6", color: "#fff", padding: "3px 8px", borderRadius: 3, fontSize: 11, fontWeight: 800 }}>paysafecard</span> },
    { label: "Crypto & more", render: () => <span style={{ color: "#888", fontSize: 13 }}>₿ + more</span> },
  ];

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <StepBadge n={3} label="Pay on G2A (any method works)" />
      <BrowserChrome url="g2a.com/checkout">
        <div style={{ background: "#f5f6f8", minHeight: "100%", padding: 40 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#111" }}>Checkout</div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, marginTop: 18 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 12 }}>Payment method</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {methods.map((o, i) => {
                  const isSel = i === 0 && selected;
                  return (
                    <div key={i} style={{
                      padding: "12px 18px", borderRadius: 10,
                      border: isSel ? "2px solid #1E9CD7" : "2px solid #e5e7eb",
                      background: isSel ? "#eaf6fd" : "#fff",
                      display: "flex", alignItems: "center", gap: 14,
                      fontSize: 15, fontWeight: 600, color: "#111",
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: 10, border: "2px solid #d1d5db", background: isSel ? "#1E9CD7" : "#fff", flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{o.label}</span>
                      {o.render()}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 22, height: "fit-content" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Order summary</div>
              <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 8, background: "linear-gradient(180deg,#003087,#0070ba)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900,
                }}>
                  <div style={{ fontSize: 12 }}>Pay<span style={{ color: "#00bcd4" }}>Pal</span></div>
                  <div style={{ fontSize: 9, opacity: 0.9 }}>Rewarble</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>PayPal Gift Card 30 EUR</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>by Rewarble · GLOBAL</div>
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #eef0f3", display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151" }}>
                <span>Subtotal</span><span>30.00 EUR</span>
              </div>
              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: "#111" }}>
                <span>Total</span><span>30.00 EUR</span>
              </div>
              <div style={{
                marginTop: 18, height: 48, borderRadius: 10,
                background: paying ? "#0e7a36" : "#F15A22",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800,
                transform: clickingPay ? "scale(0.97)" : "scale(1)",
              }}>
                {paying ? "Processing payment…" : "Pay 30.00 EUR"}
              </div>
            </div>
          </div>
        </div>
        <Cursor x={cx} y={cy} />
        {clickingPay && (
          <div style={{
            position: "absolute", left: cx - 16, top: cy - 16,
            width: 36, height: 36, borderRadius: 18,
            border: "3px solid #F15A22", opacity: Math.max(0, 1 - (frame - 95) / 13),
            transform: `scale(${1 + (frame - 95) / 10})`,
            pointerEvents: "none",
          }} />
        )}
      </BrowserChrome>
    </AbsoluteFill>
  );
};
