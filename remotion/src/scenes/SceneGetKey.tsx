import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { BrowserChrome, Cursor, StepBadge } from "../components/Browser";

// G2A "Get order" page — code revealed. Uses the SAME code that gets pasted on the site.
export const SceneGetKey: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18 } });

  const code = "9YVMBH7H4CXHCX7J";
  // Copy button center ≈ (1400, 388).
  const tX = 1400, tY = 388;
  const cx = interpolate(frame, [0, 50, 75, 130], [800, tX - 2, tX - 2, tX - 2], { extrapolateRight: "clamp" });
  const cy = interpolate(frame, [0, 50, 75, 130], [500, tY - 2, tY - 2, tY - 2], { extrapolateRight: "clamp" });
  const clicking = frame >= 70 && frame <= 90;
  const copied = frame >= 80;

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <StepBadge n={5} label="Copy your code from G2A" />
      <BrowserChrome url="g2a.com/page/get-key">
        <div style={{ background: "#f5f6f8", minHeight: "100%" }}>
          <div style={{ height: 56, background: "#fff", display: "flex", alignItems: "center", padding: "0 32px", borderBottom: "1px solid #eef0f3" }}>
            <div style={{ display: "flex", alignItems: "baseline", fontWeight: 900, fontSize: 28, letterSpacing: -1 }}>
              <span style={{ color: "#F15A22" }}>G</span>
              <span style={{ color: "#1E9CD7" }}>2A</span>
              <span style={{ color: "#1E9CD7", fontSize: 10, marginLeft: 2 }}>.COM</span>
            </div>
          </div>

          <div style={{ padding: "24px 80px" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#111" }}>Get order</div>

            <div style={{
              marginTop: 16, background: "#0b1220",
              borderRadius: 14, padding: 28, color: "#fff",
              backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.04) 75%, transparent 75%)",
              backgroundSize: "80px 80px",
            }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{
                  width: 110, height: 110, background: "linear-gradient(180deg,#003087,#0070ba)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  borderRadius: 4,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>Pay<span style={{ color: "#00bcd4" }}>Pal</span></div>
                  <div style={{ marginTop: 6, background: "#fff", color: "#003087", fontWeight: 800, padding: "2px 8px", fontSize: 11 }}>Rewarble</div>
                  <div style={{ marginTop: 6, fontSize: 11 }}>30 EUR</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>PayPal Gift Card 30 EUR - by Rewarble - GLOBAL</div>
                  <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.9, color: "#cbd5e1" }}>
                    Platform: <b style={{ color: "#fff" }}>by Rewarble</b><br/>
                    Type: <b style={{ color: "#fff" }}>Key</b><br/>
                    Region: <b style={{ color: "#fff" }}>GLOBAL</b>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18, fontSize: 12, color: "#cbd5e1" }}>
                Vendor: <b style={{ color: "#fff" }}>Ultimate_choices</b> · <span style={{ color: "#1E9CD7" }}>Contact seller</span> · Order number: <b style={{ color: "#fff" }}>92000153603583</b>
              </div>

              <div style={{ marginTop: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 13 }}>
                    <span style={{ color: "#1E9CD7" }}>⌬</span> <b>SafeKeys</b>
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1" }}>Secure digital item delivery</div>
                </div>

                <div style={{
                  marginTop: 12, background: "rgba(255,160,40,0.08)",
                  border: "1px solid #f59e0b", borderRadius: 8, padding: "10px 14px",
                }}>
                  <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 12 }}>⚠ Be careful — keep your gift card safe</div>
                </div>

                <div style={{
                  marginTop: 14, background: "#fff", borderRadius: 8, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 12,
                  boxShadow: clicking ? "0 0 0 4px rgba(30,156,215,0.35)" : "none",
                }}>
                  <div style={{ flex: 1, fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: 2 }}>{code}</div>
                  <div style={{
                    background: "#111", color: "#fff", padding: "9px 22px",
                    borderRadius: 8, fontSize: 13, fontWeight: 700,
                    transform: clicking ? "scale(0.95)" : "scale(1)",
                  }}>{copied ? "✓ Copied" : "Copy"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Cursor x={cx} y={cy} />
        {clicking && (
          <div style={{
            position: "absolute", left: cx - 16, top: cy - 16,
            width: 36, height: 36, borderRadius: 18,
            border: "3px solid #1E9CD7", opacity: Math.max(0, 1 - (frame - 70) / 20),
            transform: `scale(${1 + (frame - 70) / 14})`,
            pointerEvents: "none",
          }} />
        )}
      </BrowserChrome>
    </AbsoluteFill>
  );
};
