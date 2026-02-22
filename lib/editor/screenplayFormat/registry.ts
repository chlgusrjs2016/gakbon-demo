import { US_SCREENPLAY_FORMAT } from "./profiles/us";
import { KR_SCREENPLAY_FORMAT } from "./profiles/kr";
import type { ScreenplayFormatKey, ScreenplayFormatProfile } from "./types";

export const SCREENPLAY_FORMAT_REGISTRY: Record<ScreenplayFormatKey, ScreenplayFormatProfile> = {
  us: US_SCREENPLAY_FORMAT,
  kr: KR_SCREENPLAY_FORMAT,
};

export const SCREENPLAY_FORMAT_OPTIONS = Object.values(SCREENPLAY_FORMAT_REGISTRY).map((format) => ({
  key: format.key,
  label: format.label,
  paperPresetKey: format.paperPresetKey,
}));
