import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { BrowserChrome, Cursor, StepBadge } from "../components/Browser";

// Mirrors the real Rewarble.tsx page. Scrolls from the instructions at the top
// down to the code input field, types/pastes the code, clicks Confirm, then
// switches to the actual /checkout?completed=rewarble success card.
export const ScenePaste: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18 } });

  const code = "9YVMBH7H4CXHCX7J";

  // Timing phases
  // 0-25    show top of page (instructions) — cursor idle near right edge
  // 25-55   scroll down to reveal the code input
  // 55-75   cursor glides to input
  // 75-85   paste the code
  // 85-120  cursor glides down to confirm button
  // 120-135 click confirm
  // 138+    success screen
  const scrollY = interpolate(frame, [25, 55], [0, 560], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pasteFrame = 80;
  const typed = frame < pasteFrame ? "" : code;

  // After scrolling 560px, the code input center sits at scene (800, 160)
  // and the confirm button center at scene (800, 360).
  const inputX = 800, inputY = 160;
  const confirmX = 800, confirmY = 360;

  const cx = interpolate(
    frame,
    [0, 25, 55, 75, 95, 120],
    [1300, 1300, 1300, inputX - 2, inputX - 2, confirmX - 2],
    { extrapolateRight: "clamp" }
  );
  const cy = interpolate(
    frame,
    [0, 25, 55, 75, 95, 120],
    [200, 200, 320, inputY - 2, inputY - 2, confirmY - 2],
    { extrapolateRight: "clamp" }
  );
  const clickingConfirm = frame >= 122 && frame <= 137;
  const success = frame >= 140;

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <StepBadge n={6} label={success ? "Order received" : "Paste code & confirm"} />
      <BrowserChrome url={success ? "parfumistry.net/checkout" : "parfumistry.net/rewarble"}>
        {success ? (
          // Actual Checkout completion screen — matches Checkout.tsx isCompleted block.
          <div style={{ background: "hsl(0 0% 96%)", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
            <div style={{
              background: "hsl(0 0% 100%)", borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              maxWidth: 460, width: "100%", padding: "40px 36px",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 40,
                  background: "rgba(139, 90, 60, 0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b5a3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>
              <h1 style={{ fontSize: 30, color: "#111", textAlign: "center", marginBottom: 14, fontWeight: 500, fontFamily: "serif" }}>
                Thank you!
              </h1>
              <p style={{ textAlign: "center", fontSize: 13, fontFamily: "monospace", color: "#8b5a3c", fontWeight: 600, marginBottom: 14 }}>
                Order #1247
              </p>
              <p style={{ color: "#6b7280", textAlign: "center", fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
                Your order has been received. You will receive the order confirmation email as soon as the code is verified.
              </p>
              <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", marginBottom: 28, lineHeight: 1.5 }}>
                This usually takes a short while. Thank you for your patience.
              </p>

              <div style={{
                border: "1px solid rgba(139, 90, 60, 0.3)", background: "rgba(139, 90, 60, 0.05)",
                borderRadius: 12, padding: 18, marginBottom: 28,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    background: "rgba(139, 90, 60, 0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5a3c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#111", marginBottom: 6, textTransform: "uppercase" }}>
                      Check your email after approval
                    </div>
                    <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55, marginBottom: 8 }}>
                      Once your order has been <b style={{ color: "#111" }}>approved</b>, your confirmation and order details will be sent to <b style={{ color: "#111" }}>your inbox</b>. Approval can be <b style={{ color: "#111" }}>instant</b> or take up to a <b style={{ color: "#111" }}>few hours</b>.
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ color: "#8b5a3c" }}>⚠</span>
                      <span>Don't see it? Please check your <b style={{ color: "#111" }}>spam</b> or <b style={{ color: "#111" }}>promotions</b> folder.</span>
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                width: "100%", height: 48, borderRadius: 8, background: "#111", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
              }}>
                Continue Shopping
              </div>
            </div>
          </div>
        ) : (
          // Scrollable Rewarble page — instructions at top, code input below.
          <div style={{ background: "hsl(0 0% 13%)", minHeight: "100%", color: "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{
              transform: `translateY(${-scrollY}px)`,
              padding: "28px 0 60px",
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              <div style={{ width: 560 }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 56, height: 56, borderRadius: 28, background: "rgba(124,58,237,0.15)", marginBottom: 10,
                  }}>
                    <span style={{ fontSize: 28 }}>🎁</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>Pay with Rewarble</div>
                  <div style={{ fontSize: 13, color: "#a3a3a3", marginTop: 4 }}>Buy a PayPal Rewarble gift card to complete your order</div>
                </div>

                {/* Instructions */}
                <div style={{
                  borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)", padding: 18, marginBottom: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: "#a78bfa", marginBottom: 12, textTransform: "uppercase" }}>
                    How it works
                  </div>
                  {[
                    "Open the Rewarble PayPal listing on G2A.",
                    "Click +more and pick the amount that covers your total.",
                    "Complete the purchase (no PayPal account required).",
                    "Copy the 16-character code from your email.",
                    "Scroll down and paste it below, then confirm.",
                  ].map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 11,
                        background: "rgba(124,58,237,0.2)", color: "#a78bfa",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>{i + 1}</div>
                      <div style={{ fontSize: 13, color: "#d4d4d4", lineHeight: 1.5 }}>{t}</div>
                    </div>
                  ))}
                </div>

                {/* Disclaimer + Go to G2A button (visual only) */}
                <div style={{
                  borderRadius: 10, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)",
                  padding: "10px 14px", marginBottom: 12,
                }}>
                  <div style={{ fontSize: 12, color: "#fde68a", lineHeight: 1.5 }}>
                    You do <b>not</b> need a PayPal account — G2A checkout accepts cards and other methods.
                  </div>
                </div>
                <div style={{
                  height: 44, borderRadius: 8, background: "#7C3AED", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, marginBottom: 22,
                }}>
                  Buy Rewarble gift card on G2A →
                </div>

                {/* Order amount */}
                <div style={{
                  borderRadius: 12, border: "1px solid rgba(124,58,237,0.35)",
                  background: "rgba(124,58,237,0.08)", padding: 16, textAlign: "center", marginBottom: 18,
                }}>
                  <div style={{ fontSize: 12, color: "#a3a3a3", marginBottom: 4 }}>Order amount</div>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>€30.00</div>
                </div>

                {/* Enter code panel */}
                <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>Enter your code</div>
                  </div>
                  <div style={{ padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: "#d4d4d4" }}>REWARBLE CODE</div>
                    <div style={{
                      marginTop: 8, height: 48, borderRadius: 8,
                      border: frame >= pasteFrame ? "2px solid #7C3AED" : "1px solid rgba(255,255,255,0.12)",
                      background: "hsl(0 0% 13%)", display: "flex", alignItems: "center", padding: "0 14px",
                      fontFamily: "monospace", fontSize: 18, color: "#fff",
                      boxShadow: frame >= pasteFrame ? "0 0 0 4px rgba(124,58,237,0.18)" : "none",
                    }}>
                      {typed || <span style={{ color: "#666" }}>Paste your Rewarble code here...</span>}
                      <span style={{ opacity: frame % 30 < 15 && frame < pasteFrame ? 1 : 0 }}>|</span>
                    </div>

                    <div style={{
                      marginTop: 12, height: 36, borderRadius: 8,
                      border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 600,
                    }}>+ Add another code</div>

                    <div style={{
                      marginTop: 12, borderRadius: 8, background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.3)", padding: "10px 14px",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#fcd34d", marginBottom: 2 }}>⚠ Send the Rewarble code, not the order number</div>
                      <div style={{ fontSize: 10, color: "#fde68a", lineHeight: 1.5 }}>
                        The code looks like <b style={{ fontFamily: "monospace" }}>9YVMBH7H4CXHCX7J</b>.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm */}
                <div style={{
                  height: 52, borderRadius: 8,
                  background: "#16a34a",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, letterSpacing: 0.5,
                  transform: clickingConfirm ? "scale(0.98)" : "scale(1)",
                  boxShadow: "0 8px 20px rgba(22,163,74,0.35)",
                  opacity: typed ? 1 : 0.4,
                }}>
                  ✓ Confirm Payment
                </div>
              </div>
            </div>

            {/* Scrollbar hint on the right */}
            <div style={{
              position: "absolute", top: 8, right: 6, bottom: 8, width: 6,
              background: "rgba(255,255,255,0.04)", borderRadius: 3,
            }}>
              <div style={{
                position: "absolute", left: 0, right: 0,
                top: interpolate(scrollY, [0, 560], [0, 480]),
                height: 180, background: "rgba(255,255,255,0.2)", borderRadius: 3,
              }} />
            </div>
          </div>
        )}
        {!success && <Cursor x={cx} y={cy} />}
        {clickingConfirm && (
          <div style={{
            position: "absolute", left: cx - 16, top: cy - 16,
            width: 36, height: 36, borderRadius: 18,
            border: "3px solid #16a34a", opacity: Math.max(0, 1 - (frame - 122) / 15),
            transform: `scale(${1 + (frame - 122) / 12})`,
            pointerEvents: "none",
          }} />
        )}
      </BrowserChrome>
    </AbsoluteFill>
  );
};
