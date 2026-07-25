import { DEFAULT_DEMO_STYLE } from "./demoStylePreview";
import { type RoomType, type StagingStyle } from "@/lib/errors";

export const DEMO_PREVIEW_IMAGE_BASE_PATH = "/demo";
export const DEMO_PREVIEW_IMAGE_EXTENSION = "png";
export const DEFAULT_DEMO_INTERIOR_TYPE: RoomType = "living-room";
export const DEFAULT_DEMO_EXTERIOR_TYPE: RoomType = "outdoor";

const FOLDERED_DEMO_STYLES = new Set<StagingStyle>([
  "bohemian",
  "coastal",
  "contemporary",
  "farmhouse",
  "industrial",
  "luxury",
  "mid-century",
  "transitional",
]);

const DEMO_STYLE_FOLDER_NAMES: Record<StagingStyle, string> = {
  modern: "Modern",
  contemporary: "Contemporary",
  minimalist: "Minimalist",
  scandinavian: "Scandinavian",
  industrial: "Industrial",
  traditional: "Traditional",
  transitional: "Transitional",
  farmhouse: "Farmhouse",
  coastal: "Coastal",
  bohemian: "Bohemian",
  "mid-century": "Mid Century",
  luxury: "Luxury",
};

type DemoPreviewImageParams = {
  areaType: "interior" | "exterior";
  roomType?: RoomType;
  exteriorType?: RoomType;
  stagingStyle?: StagingStyle;
  extension?: string;
};

type DemoComparisonImageParams = DemoPreviewImageParams & {
  before?: boolean;
};

const normalizeSubjectType = (subjectType: string) => subjectType.trim().toLowerCase().replace(/\s+/g, "-");

const getExteriorSceneSlug = (subjectType: string) => {
  const normalizedType = normalizeSubjectType(subjectType);

  if (normalizedType === "garage") {
    return "garage";
  }

  if (normalizedType === "other" || normalizedType === "backyard") {
    return "backyard";
  }

  return "outdoor";
};

const getFinalsStyleSlug = (stagingStyle: StagingStyle, empty: boolean) => {
  const normalizedStyle = normalizeSubjectType(String(stagingStyle));

  if (empty && normalizedStyle === "mid-century") {
    return "mid-century";
  }

  return normalizedStyle;
};

const buildLegacyStylePreviewPath = (style: StagingStyle, extension: string = DEMO_PREVIEW_IMAGE_EXTENSION) => {
  return `${DEMO_PREVIEW_IMAGE_BASE_PATH}/${style}-1.${extension}`;
};

export const getDemoStyleFolderName = (style: StagingStyle) => {
  return DEMO_STYLE_FOLDER_NAMES[style] || DEMO_STYLE_FOLDER_NAMES[DEFAULT_DEMO_STYLE];
};

export const buildDemoPreviewImagePath = (
  styleFolder: string,
  imageName: string,
  extension: string = DEMO_PREVIEW_IMAGE_EXTENSION
) => `${DEMO_PREVIEW_IMAGE_BASE_PATH}/${styleFolder}/${imageName}.${extension}`;

export const buildDemoPreviewImageFileName = (subjectType: string, stagingStyle: StagingStyle) => {
  return `${normalizeSubjectType(subjectType)}-${stagingStyle}`;
};

export const getDemoPreviewImageUrl = ({
  areaType,
  roomType,
  exteriorType,
  stagingStyle,
  extension = DEMO_PREVIEW_IMAGE_EXTENSION,
}: DemoPreviewImageParams) => {
  return getDemoComparisonImageUrl({ areaType, roomType, exteriorType, stagingStyle, extension, before: false });
};

export const getDemoPreviewImageUrls = (params: DemoPreviewImageParams, variantCount = 3) => {
  const previewImageUrl = getDemoPreviewImageUrl(params);
  return Array.from({ length: variantCount }, () => previewImageUrl);
};

export const getDemoComparisonImageUrl = ({
  areaType,
  roomType,
  exteriorType,
  stagingStyle,
  before = false,
  extension = DEMO_PREVIEW_IMAGE_EXTENSION,
}: DemoComparisonImageParams) => {
  if (areaType === "exterior") {
    const resolvedExteriorType = exteriorType || roomType || DEFAULT_DEMO_EXTERIOR_TYPE;
    const exteriorSceneSlug = getExteriorSceneSlug(resolvedExteriorType);
    const sideSlug = before ? "before" : "after";

    return `${DEMO_PREVIEW_IMAGE_BASE_PATH}/exterior/${exteriorSceneSlug}-${sideSlug}.${extension}`;
  }

  return getFinalsImageUrl({
    roomType: roomType || DEFAULT_DEMO_INTERIOR_TYPE,
    stagingStyle: stagingStyle || DEFAULT_DEMO_STYLE,
    empty: before,
    extension,
  });
};

type FinalsImageParams = {
  roomType: string;
  stagingStyle: StagingStyle;
  empty?: boolean;
  extension?: string;
};

// Finals images live at /demo/finals and follow the pattern:
// empty-<room>-<style>.png  (empty) and <room>-<style>.png (furnished)
export const getFinalsImageUrl = ({
  roomType,
  stagingStyle,
  empty = false,
  extension = DEMO_PREVIEW_IMAGE_EXTENSION,
}: FinalsImageParams) => {
  const normalizedRoom = normalizeSubjectType(roomType);
  const normalizedStyle = getFinalsStyleSlug(stagingStyle, empty);
  const prefix = empty ? "empty-" : "";
  return `${DEMO_PREVIEW_IMAGE_BASE_PATH}/interior/${prefix}${normalizedRoom}-${normalizedStyle}.${extension}`;
};
