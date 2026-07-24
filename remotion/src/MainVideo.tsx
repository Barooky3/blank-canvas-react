import { AbsoluteFill, Series } from "remotion";
import { SceneSiteIntro } from "./scenes/SceneSiteIntro";
import { SceneBrowse } from "./scenes/SceneBrowse";
import { SceneBuy } from "./scenes/SceneBuy";
import { SceneEmail } from "./scenes/SceneEmail";
import { SceneGetKey } from "./scenes/SceneGetKey";
import { ScenePaste } from "./scenes/ScenePaste";
import { loadFont } from "@remotion/google-fonts/Inter";

loadFont("normal", { weights: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"] });

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f17", fontFamily: "Inter, sans-serif" }}>
      <Series>
        <Series.Sequence durationInFrames={140}>
          <SceneSiteIntro />
        </Series.Sequence>
        <Series.Sequence durationInFrames={130}>
          <SceneBrowse />
        </Series.Sequence>
        <Series.Sequence durationInFrames={130}>
          <SceneBuy />
        </Series.Sequence>
        <Series.Sequence durationInFrames={140}>
          <SceneEmail />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <SceneGetKey />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <ScenePaste />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
