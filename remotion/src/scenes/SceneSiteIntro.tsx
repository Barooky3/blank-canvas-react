import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { BrowserChrome, Cursor, StepBadge } from "../components/Browser";

// Intro: show the parfumistry.net/rewarble page with order amount + instructions.
// We scroll the instruction panel and then the cursor clicks the "Find 30 EUR PayPal Rewarble on G2A" button.
export const SceneSiteIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18 } });

  // Scroll the instructions container after a beat, then settle.
  const scrollY = interpolate(frame, [25, 90], [0, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Button absolute target inside inner content (1600 wide). After scroll=160 the button center sits at ~ (707, 342).
  // SVG cursor tip is near (2,2) so we offset the SVG by -2,-2 from the click target.
  const targetX = 707;
  const targetY = 342;
  const cx = interpolate(frame, [0, 60, 105, 130], [1100, 900, targetX - 2, targetX - 2], { extrapolateRight: "clamp" });
  const cy = interpolate(frame, [0, 60, 105, 130], [780, 500, targetY - 2, targetY - 2], { extrapolateRight: "clamp" });
  const clicking = frame >= 110 && frame <= 122;
  const buttonPressed = frame >= 110;

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <StepBadge n={1} label="Open the Rewarble payment page" />
      <BrowserChrome url="parfumistry.net/rewarble">
        <div style={{
          background: "hsl(0 0% 13%)", minHeight: "100%", color: "#fff",
          padding: "40px 0", display: "flex", justifyContent: "center",
          overflow: "hidden",
        }}>
          <div style={{ width: 560, transform: `translateY(${-scrollY}px)` }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 56, height: 56, borderRadius: 28, background: "rgba(124,58,237,0.15)", marginBottom: 14,
              }}>
                <span style={{ fontSize: 28 }}>🎁</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: "#fff" }}>Pay with Rewarble</div>
            </div>

            {/* Order amount */}
            <div style={{
              borderRadius: 12, border: "1px solid rgba(124,58,237,0.35)",
              background: "rgba(124,58,237,0.08)", padding: 18, textAlign: "center", marginBottom: 18,
            }}>
              <div style={{ fontSize: 12, color: "#a3a3a3", marginBottom: 4 }}>Order amount</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>€30.00</div>
            </div>

            {/* Warn */}
            <div style={{
              borderRadius: 10, border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.08)",
              padding: "10px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ color: "#fbbf24" }}>⚠</span>
              <span style={{ fontSize: 12, color: "#fde68a" }}>Please follow the payment instructions carefully to avoid delays with your order.</span>
            </div>

            {/* Instructions card */}
            <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", overflow: "hidden", marginBottom: 18 }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: 0.5 }}>Payment instructions</div>
              </div>
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { n: 1, t: "Purchase a PayPal Rewarble gift card on G2A", d: "Your cart total is €30.00, so the closest PayPal Rewarble card that covers it is 30 EUR. Tap the button — it opens G2A with a search for that exact card. Check out using whichever method you prefer (Visa, Mastercard, Apple Pay, Google Pay, Paysafecard & more).", btn: true },
                  { n: 2, t: "Get your Rewarble code by email", d: "Right after purchase, G2A sends the PayPal Rewarble code to your email — usually within a minute. Open the email, copy the 16-character code." },
                  { n: 3, t: "Confirm your payment", d: "Press the green Confirm Payment button at the bottom. Your code is validated and your order is placed." },
                ].map(s => (
                  <div key={s.n} style={{ display: "flex", gap: 12 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 12, background: "#7C3AED", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2,
                    }}>{s.n}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.t}</div>
                      <div style={{ fontSize: 11, color: "#a3a3a3", lineHeight: 1.6, marginTop: 3 }}>{s.d}</div>
                      {s.btn && (
                        <>
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {["Visa", "Mastercard", "Apple Pay", "Google Pay", "Paysafecard", "& more"].map(p => (
                              <span key={p} style={{ fontSize: 10, color: "#a3a3a3", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4 }}>{p}</span>
                            ))}
                          </div>
                          <div style={{
                            marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "8px 14px", borderRadius: 8,
                            border: clicking ? "2px solid #7C3AED" : "1px solid rgba(255,255,255,0.15)",
                            background: buttonPressed ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.03)",
                            color: "#fff", fontSize: 12, fontWeight: 600,
                            transform: clicking ? "scale(0.98)" : "scale(1)",
                          }}>
                            ↗ Find 30 EUR PayPal Rewarble on G2A
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Cursor x={cx} y={cy} />
        {clicking && (
          <div style={{
            position: "absolute", left: cx - 14, top: cy - 14,
            width: 32, height: 32, borderRadius: 16,
            border: "3px solid #7C3AED", opacity: Math.max(0, 1 - (frame - 110) / 12),
            transform: `scale(${1 + (frame - 110) / 10})`,
            pointerEvents: "none",
          }} />
        )}
      </BrowserChrome>
    </AbsoluteFill>
  );
};
