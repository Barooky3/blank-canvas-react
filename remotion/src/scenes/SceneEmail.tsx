import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { BrowserChrome, Cursor, StepBadge } from "../components/Browser";

// G2A order email opened in Gmail for the PayPal Rewarble 30 EUR purchase.
export const SceneEmail: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18 } });

  // Inbox first row center ≈ (700, 38). "Get order" button center ≈ (455, 309).
  const inboxX = 700, inboxY = 38;
  const getX = 455, getY = 309;
  const cx = interpolate(frame, [0, 18, 32, 90, 130], [1000, inboxX - 2, inboxX - 2, getX - 2, getX - 2], { extrapolateRight: "clamp" });
  const cy = interpolate(frame, [0, 18, 32, 90, 130], [400, inboxY - 2, inboxY - 2, getY - 2, getY - 2], { extrapolateRight: "clamp" });
  const clickInbox = frame >= 22 && frame <= 32;
  const openEmail = frame >= 32;
  const clickGet = frame >= 95 && frame <= 112;

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <StepBadge n={4} label="Open the G2A email & press Get order" />
      <BrowserChrome url="mail.google.com">
        <div style={{ display: "flex", height: "100%", background: "#fff" }}>
          {/* Gmail sidebar */}
          <div style={{ width: 200, background: "#f6f8fc", padding: 16, borderRight: "1px solid #e3e6eb" }}>
            <div style={{ padding: "10px 18px", background: "#d3e3fd", borderRadius: 999, fontWeight: 700, color: "#001d35", fontSize: 13 }}>📥 Inbox</div>
            <div style={{ marginTop: 10, color: "#444", fontSize: 12, padding: "8px 18px" }}>⭐ Starred</div>
            <div style={{ color: "#444", fontSize: 12, padding: "8px 18px" }}>📤 Sent</div>
            <div style={{ color: "#444", fontSize: 12, padding: "8px 18px" }}>📋 Drafts</div>
          </div>

          <div style={{ flex: 1, padding: "16px 28px", overflow: "hidden" }}>
            {!openEmail ? (
              <div style={{ borderTop: "1px solid #e3e6eb" }}>
                {[
                  { from: "G2A.COM", subj: "You bought PayPal Gift Card 30 EUR - by Rewarble - GLOBAL from Ultimate_choices (92000153603583)", time: "10:00 PM", bold: true, hl: true },
                  { from: "Newsletter", subj: "Weekly digest — top picks", time: "1h" },
                  { from: "GitHub", subj: "Security alert: new sign-in", time: "3h" },
                  { from: "Spotify", subj: "Your daily mix is ready", time: "5h" },
                ].map((m, i) => (
                  <div key={i} style={{
                    padding: "12px 16px", borderBottom: "1px solid #e3e6eb", display: "flex", gap: 16,
                    background: m.hl && clickInbox ? "#eaf2fe" : "#fff",
                    fontWeight: m.bold ? 700 : 400, fontSize: 13, color: "#202124",
                  }}>
                    <div style={{ width: 160 }}>{m.from}</div>
                    <div style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.subj}</div>
                    <div style={{ color: "#5f6368" }}>{m.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 20, color: "#202124", fontWeight: 400 }}>
                  You bought PayPal Gift Card 30 EUR - by Rewarble - GLOBAL from Ultimate_choices (92000153603583)
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: "#ef6c00", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>G</div>
                  <div style={{ fontSize: 13, color: "#202124" }}>
                    <b>G2A.COM</b> <span style={{ color: "#5f6368" }}>&lt;no-reply@g2a.com&gt;</span>
                    <div style={{ color: "#5f6368", fontSize: 11 }}>to me</div>
                  </div>
                  <div style={{ marginLeft: "auto", color: "#5f6368", fontSize: 11 }}>Tue, May 19, 10:00 PM</div>
                </div>

                {/* Email body */}
                <div style={{ marginTop: 16, border: "1px solid #e3e6eb", borderRadius: 4, padding: 24, background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 10, borderBottom: "4px solid #F15A22" }}>
                    <div style={{ display: "flex", alignItems: "baseline", fontWeight: 900, fontSize: 26, letterSpacing: -1 }}>
                      <span style={{ color: "#F15A22" }}>G</span>
                      <span style={{ color: "#1E9CD7" }}>2A</span>
                      <span style={{ color: "#1E9CD7", fontSize: 9, marginLeft: 2 }}>.COM</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#111", fontWeight: 700 }}>World’s Largest Marketplace for Digital Entertainment</div>
                  </div>

                  <div style={{ marginTop: 18, fontSize: 26, fontWeight: 700, color: "#111" }}>Hello!</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#333" }}>Here is your order from Ultimate_choices.</div>

                  <div style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 6, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
                    {/* PayPal Rewarble card art */}
                    <div style={{
                      width: 110, height: 110, borderRadius: 4,
                      background: "linear-gradient(180deg,#003087,#0070ba)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      color: "#fff",
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 900 }}>Pay<span style={{ color: "#00bcd4" }}>Pal</span></div>
                      <div style={{ marginTop: 8, background: "#fff", color: "#003087", fontWeight: 800, padding: "2px 10px", fontSize: 12 }}>Rewarble</div>
                      <div style={{ marginTop: 6, fontSize: 12 }}>30 EUR</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>PayPal Gift Card 30 EUR - by Rewarble - GLOBAL</div>
                      <div style={{
                        marginTop: 10, display: "inline-block",
                        padding: "9px 26px",
                        border: clickGet ? "2px solid #1E9CD7" : "1px solid #1E9CD7",
                        borderRadius: 4, color: "#1E9CD7", fontWeight: 600, fontSize: 13,
                        background: clickGet ? "#eaf6fd" : "#fff",
                        transform: clickGet ? "scale(0.97)" : "scale(1)",
                      }}>Get order</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: "#111" }}>1 x <b>30.00 EUR</b></div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>VAT inc. if applicable</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid #e5e7eb", fontSize: 13, color: "#111" }}>
                    <span>Total price</span><b>30.00 EUR</b>
                  </div>

                  <div style={{ marginTop: 18, fontSize: 12, color: "#6b7280" }}>Order number</div>
                  <div style={{ fontSize: 14, color: "#111", fontWeight: 600 }}>92000153603583</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Cursor x={cx} y={cy} />
        {(clickInbox || clickGet) && (
          <div style={{
            position: "absolute", left: cx - 14, top: cy - 14,
            width: 32, height: 32, borderRadius: 16,
            border: "3px solid #1E9CD7", opacity: Math.max(0, clickGet ? 1 - (frame - 95) / 17 : 1 - (frame - 22) / 10),
            transform: `scale(${1 + (clickGet ? (frame - 95) / 12 : (frame - 22) / 8)})`,
            pointerEvents: "none",
          }} />
        )}
      </BrowserChrome>
    </AbsoluteFill>
  );
};
