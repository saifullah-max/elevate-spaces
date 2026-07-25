import type { StagingStyle } from "@/lib/errors";

export const DEFAULT_DEMO_STYLE: StagingStyle = "modern";

const buildVariantUrls = (style: StagingStyle) => {
  return [`/demo/${style}-1.png`];
};

export const DEMO_STYLE_PREVIEW_URLS: Record<StagingStyle, string[]> = {
  modern: buildVariantUrls("modern"),
  contemporary: buildVariantUrls("contemporary"),
  minimalist: buildVariantUrls("minimalist"),
  scandinavian: buildVariantUrls("scandinavian"),
  industrial: buildVariantUrls("industrial"),
  traditional: buildVariantUrls("traditional"),
  transitional: buildVariantUrls("transitional"),
  farmhouse: buildVariantUrls("farmhouse"),
  coastal: buildVariantUrls("coastal"),
  bohemian: buildVariantUrls("bohemian"),
  "mid-century": buildVariantUrls("mid-century"),
  luxury: buildVariantUrls("luxury"),
};

export const getLocalStyleVariantUrls = (style: StagingStyle): string[] => {
  return DEMO_STYLE_PREVIEW_URLS[style] || DEMO_STYLE_PREVIEW_URLS[DEFAULT_DEMO_STYLE];
};
