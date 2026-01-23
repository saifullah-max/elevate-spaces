import { VALID_ROOM_TYPES, VALID_STAGING_STYLES, type RoomType, type StagingStyle } from "@/lib/errors";

// Dropdown options (label-value pairs)
export const interiorOptions: { label: string; value: RoomType }[] = [
    { label: "Living Room", value: "living-room" },
    { label: "Bedroom", value: "bedroom" },
    { label: "Kitchen", value: "kitchen" },
    { label: "Bathroom", value: "bathroom" },
    { label: "Dining Room", value: "dining-room" },
    { label: "Office", value: "office" },
    { label: "Basement", value: "basement" },
    { label: "Attic", value: "attic" },
    { label: "Hallway", value: "hallway" },
    { label: "Other", value: "other" },
];
export const exteriorOptions: { label: string; value: RoomType }[] = [
    { label: "Outdoor", value: "outdoor" },
    { label: "Garage", value: "garage" },
    { label: "Other", value: "other" },
];
export const stagingStyles: { label: string; value: StagingStyle }[] = [
    { label: "Modern", value: "modern" },
    { label: "Contemporary", value: "contemporary" },
    { label: "Minimalist", value: "minimalist" },
    { label: "Scandinavian", value: "scandinavian" },
    { label: "Industrial", value: "industrial" },
    { label: "Traditional", value: "traditional" },
    { label: "Transitional", value: "transitional" },
    { label: "Farmhouse", value: "farmhouse" },
    { label: "Coastal", value: "coastal" },
    { label: "Bohemian", value: "bohemian" },
    { label: "Mid-century", value: "mid-century" },
    { label: "Luxury", value: "luxury" },
];