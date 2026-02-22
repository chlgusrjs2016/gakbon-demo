import type { ScreenplayFormatProfile } from "../types";

const screenplayBaseFont = '"Screenplay Composite", Pretendard, sans-serif';

export const KR_SCREENPLAY_FORMAT: ScreenplayFormatProfile = {
  key: "kr",
  label: "KR",
  paperPresetKey: "a4",
  layoutMode: "kr_dialogue_inline",
  visual: {
    base: {
      fontFamily: screenplayBaseFont,
      fontSize: 16,
      lineHeight: 1,
      letterSpacing: 0,
      color: "#000000",
    },
    paragraph: { marginTop: "0", marginBottom: "0", paddingLeft: 144, paddingRight: 96 },
    sceneHeading: {
      marginTop: "2em",
      marginBottom: "0",
      paddingLeft: 144,
      paddingRight: 96,
      textTransform: "uppercase",
      fontWeight: 400,
    },
    action: { marginTop: "1em", marginBottom: "0", paddingLeft: 96, paddingRight: 96 },
    character: {
      marginTop: "1em",
      marginBottom: "0",
      paddingLeft: 144,
      paddingRight: 506,
      textTransform: "uppercase",
      fontWeight: 700,
    },
    dialogue: { marginTop: "0", marginBottom: "0", paddingLeft: 240, paddingRight: 192 },
    parenthetical: {
      marginTop: "0",
      marginBottom: "0",
      paddingLeft: 298,
      paddingRight: 250,
      fontStyle: "normal",
    },
    transition: {
      marginTop: "1em",
      marginBottom: "0",
      paddingLeft: 144,
      paddingRight: 96,
      textAlign: "right",
      textTransform: "uppercase",
      fontWeight: 400,
    },
  },
  breakPolicies: {
    sceneHeading: "block_only",
    action: "line_split",
    character: "block_only",
    dialogue: "line_split",
    parenthetical: "block_only",
    transition: "block_only",
    paragraph: "line_split",
    unknown: "block_only",
  },
  source: "builtin",
  fontCoverage: {
    latin: "courier_prime",
    digits: "courier_prime",
    punctuation: "courier_prime",
    hangul: "kopub_batang",
    other: "kopub_batang",
  },
  dialogueLane: {
    characterStartInch: 1.5,
    characterEndInch: 3,
    speechStartInch: 3,
    speechEndInch: 7.27,
  },
};
