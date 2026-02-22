import type { ScreenplayFormatProfile } from "../types";

const screenplayBaseFont =
  '"Screenplay Composite", Pretendard, sans-serif';

export const US_SCREENPLAY_FORMAT: ScreenplayFormatProfile = {
  key: "us",
  label: "US",
  paperPresetKey: "us_letter",
  layoutMode: "us_dialogue_block",
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
    action: { marginTop: "1em", marginBottom: "0", paddingLeft: 144, paddingRight: 96 },
    character: {
      marginTop: "1em",
      marginBottom: "0",
      paddingLeft: 355,
      paddingRight: 298,
      textTransform: "uppercase",
      fontWeight: 400,
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
    characterStartInch: 3.7,
    characterEndInch: 4.7,
    speechStartInch: 2.5,
    speechEndInch: 6.5,
  },
};
