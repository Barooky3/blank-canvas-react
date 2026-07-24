import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { BrowserChrome, Cursor, StepBadge } from "../components/Browser";

const G2ALogo: React.FC<{ size?: number }> = ({ size = 38 }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 0, fontWeight: 900, fontSize: size, letterSpacing: -1, lineHeight: 1 }}>
    <span style={{ color: "#F15A22" }}>G</span>
    <span style={{ color: "#1E9CD7" }}>2A</span>
    <span style={{ color: "#1E9CD7", fontSize: size * 0.28, marginLeft: 2, transform: "translateY(-6px)" }}>.COM</span>
  </div>
);

const G2AHeader: React.FC = () => (
  <>
    <div style={{ height: 64, background: "#fff", display: "flex", alignItems: "center", padding: "0 32px", borderBottom: "1px solid #eef0f3" }}>
      <G2ALogo />
      <div style={{
        marginLeft: 28, flex: 1, height: 40, background: "#fff", border: "2px solid #e5e7eb",
        borderRadius: 999, display: "flex", alignItems: "center", padding: "0 4px 0 22px", fontSize: 14, color: "#9ca3af",
      }}>
        <span style={{ flex: 1 }}>What are you looking for?</span>
        <div style={{ marginLeft: 4, width: 36, height: 32, borderRadius: 999, background: "#1E9CD7", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>🔍</div>
      </div>
      <div style={{ marginLeft: 24, display: "flex", alignItems: "center", gap: 16, color: "#111", fontSize: 13, fontWeight: 600 }}>
        <div style={{ padding: "6px 12px", background: "#111", color: "#fff", borderRadius: 8 }}>EN / EUR</div>
        <div>Sign in</div>
        <div>♡</div>
        <div>🛒</div>
      </div>
    </div>
    <div style={{ height: 42, background: "#fff", borderBottom: "1px solid #eef0f3", display: "flex", alignItems: "center", padding: "0 32px", gap: 28, fontSize: 13, color: "#111", fontWeight: 600 }}>
      <span>🎮 Gaming</span>
      <span>💻 Software</span>
      <span>📺 Subscriptions</span>
      <span style={{ color: "#F15A22" }}>🎁 Gift cards</span>
      <span>🏷 OUTLET</span>
      <span style={{ color: "#7c3aed" }}>+ Pay less with G2A Plus</span>
    </div>
  </>
);

// Variant tile (the small amount squares on the G2A product page)
const Tile: React.FC<{ label: string; selected?: boolean; highlight?: boolean; blue?: boolean }> = ({ label, selected, highlight, blue }) => (
  <div style={{
    width: 72, height: 56, borderRadius: 6,
    border: highlight ? "2px solid #16a34a" : selected ? "2px solid #1E9CD7" : "1px solid #e5e7eb",
    background: blue ? "#fff" : "#fff",
    color: blue ? "#1E9CD7" : "#111",
    fontWeight: 700, fontSize: 13,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1,
    boxShadow: highlight ? "0 0 0 4px rgba(22,163,74,0.18), 0 10px 22px rgba(22,163,74,0.25)" : "none",
    transform: highlight ? "scale(1.05)" : "scale(1)",
  }}>
    {label.split(" ").map((l, i) => <span key={i}>{l}</span>)}
  </div>
);

export const SceneBrowse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18 } });

  // Phases:
  // 0-40   show page, cursor moves toward "+189 more" tile (the blue one bottom-right of the small grid)
  // 40-50  click "+189"
  // 50-60  grid expands (more rows appear)
  // 60-110 cursor drifts down to 30 EUR tile inside the expanded grid
  // 110-130 highlight 30 EUR + click
  const expanded = frame >= 50;

  // Coordinates are in BrowserChrome inner content space (1600 x 852).
  // Cursor tip sits at (+2, +2) inside its 28x28 svg, so subtract 2.
  // "+189 more" tile center — bottom-right of the base 7-col grid in the variant card.
  const moreX = 1038, moreY = 572;
  // 30 EUR tile center — 4th expanded row, 6th column.
  const thirtyX = 958, thirtyY = 700;

  const cx = interpolate(
    frame,
    [0, 38, 50, 60, 105, 130],
    [1400, moreX - 2, moreX - 2, moreX - 2, thirtyX - 2, thirtyX - 2],
    { extrapolateRight: "clamp" }
  );
  const cy = interpolate(
    frame,
    [0, 38, 50, 60, 105, 130],
    [200, moreY - 2, moreY - 2, moreY - 2, thirtyY - 2, thirtyY - 2],
    { extrapolateRight: "clamp" }
  );
  const clickMore = frame >= 40 && frame <= 50;
  const clickThirty = frame >= 110 && frame <= 122;
  const highlightThirty = frame >= 108;

  // Base amount tiles visible from the start (matches real G2A page)
  const baseRow1 = ["60 EUR", "1 USD", "1 GBP", "1 EUR", "1 CAD", "1 AUD", "2 USD"];
  const baseRow2 = ["2 AUD", "2 CAD", "3 USD", "3 AUD", "3 CAD", "4 USD", "+189 more"];

  // Extra rows revealed when "+more" is clicked
  const extraRow1 = ["5 EUR", "5 USD", "5 GBP", "10 EUR", "10 USD", "10 GBP", "15 EUR"];
  const extraRow2 = ["15 USD", "20 EUR", "20 USD", "25 EUR", "25 USD", "30 EUR", "30 USD"];
  const extraRow3 = ["40 EUR", "50 EUR", "50 USD", "60 USD", "75 EUR", "100 EUR", "100 USD"];

  const expandProgress = interpolate(frame, [50, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <StepBadge n={2} label="Open the Rewarble listing & pick your amount" />
      <BrowserChrome url="g2a.com/paypal-gift-card-60-eur-by-rewarble-global">
        <div style={{ background: "#f5f6f8", minHeight: "100%" }}>
          <G2AHeader />

          <div style={{ padding: "20px 56px 60px" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>G2A › Gift cards › Cash gift cards › <b style={{ color: "#111" }}>PayPal Gift Card</b></div>
            <div style={{ marginTop: 16, fontSize: 30, fontWeight: 800, color: "#111", lineHeight: 1.1 }}>
              PayPal Gift Card 60 EUR - by Rewarble - GLOBAL
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>★★★★★ 4.9 · 28 reviews</div>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "420px 1fr 360px", gap: 24, alignItems: "flex-start" }}>
              {/* Product image */}
              <div style={{
                background: "linear-gradient(180deg,#1E9CD7,#0070ba)", borderRadius: 12,
                height: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "#fff",
              }}>
                <div style={{ fontSize: 110, fontWeight: 900, lineHeight: 1 }}>Pay<span style={{ color: "#fff", opacity: 0.95 }}>Pal</span></div>
                <div style={{ marginTop: 16, background: "#fff", color: "#003087", fontWeight: 800, padding: "4px 14px", fontSize: 14, borderRadius: 4 }}>Rewarble</div>
              </div>

              {/* Variant chooser */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 22, border: "1px solid #eef0f3" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 1 }}>CHOOSE VARIANT</div>

                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 14px", alignItems: "center", fontSize: 13, color: "#374151" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>R</div>
                  <div>Platform: <b style={{ color: "#111" }}>By Rewarble</b></div>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>🔑</div>
                  <div>Type: <b style={{ color: "#111" }}>Key</b></div>
                </div>

                <div style={{ marginTop: 16, fontSize: 13, color: "#374151" }}>Region:</div>
                <div style={{ marginTop: 6, height: 38, borderRadius: 8, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 14px", fontSize: 13, color: "#111", background: "#f9fafb" }}>
                  GLOBAL <span style={{ marginLeft: "auto" }}>▾</span>
                </div>

                <div style={{ marginTop: 16, fontSize: 13, color: "#374151" }}>Amount:</div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 72px)", gap: 8 }}>
                    {baseRow1.map((l, i) => <Tile key={l} label={l} selected={i === 0} />)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 72px)", gap: 8 }}>
                    {baseRow2.map((l) => (
                      <Tile key={l} label={l} blue={l.startsWith("+")} />
                    ))}
                  </div>

                  {/* Expanded rows */}
                  <div style={{
                    overflow: "hidden",
                    maxHeight: expandProgress * 230,
                    opacity: expandProgress,
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 72px)", gap: 8 }}>
                      {extraRow1.map((l) => <Tile key={l} label={l} />)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 72px)", gap: 8 }}>
                      {extraRow2.map((l) => <Tile key={l} label={l} highlight={l === "30 EUR" && highlightThirty} />)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 72px)", gap: 8 }}>
                      {extraRow3.map((l) => <Tile key={l} label={l} />)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller box */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #eef0f3" }}>
                <div style={{ background: "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 4, display: "inline-block" }}>G2A PLUS</div>
                <div style={{ marginTop: 14, fontSize: 12, color: "#6b7280", fontWeight: 700 }}>OFFER FROM BUSINESS SELLER</div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 19, background: "linear-gradient(135deg,#1E9CD7,#0070ba)" }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>Dream_codes</div>
                    <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>100% Positive feedback</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, fontSize: 28, fontWeight: 900, color: "#111" }}>
                  {highlightThirty ? "38.20 EUR" : "76.44 EUR"}
                </div>
                <div style={{ marginTop: 12, height: 44, borderRadius: 8, background: "#1E9CD7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                  Add to cart
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "#1E9CD7", textAlign: "center", fontWeight: 600 }}>View offers from 15 other Sellers</div>
              </div>
            </div>
          </div>

          <Cursor x={cx} y={cy} />
          {clickMore && (
            <div style={{
              position: "absolute", left: cx - 16, top: cy - 16,
              width: 36, height: 36, borderRadius: 18,
              border: "3px solid #1E9CD7", opacity: Math.max(0, 1 - (frame - 40) / 10),
              transform: `scale(${1 + (frame - 40) / 8})`,
              pointerEvents: "none",
            }} />
          )}
          {clickThirty && (
            <div style={{
              position: "absolute", left: cx - 16, top: cy - 16,
              width: 36, height: 36, borderRadius: 18,
              border: "3px solid #16a34a", opacity: Math.max(0, 1 - (frame - 110) / 12),
              transform: `scale(${1 + (frame - 110) / 10})`,
              pointerEvents: "none",
            }} />
          )}
        </div>
      </BrowserChrome>
    </AbsoluteFill>
  );
};
