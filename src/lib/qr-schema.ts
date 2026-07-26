import { z } from "zod";

export const errorCorrectionLevels = ["L", "M", "Q", "H"] as const;
const hexColor = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const qrFormSchema = z.object({
  name: z.string().trim().max(255).optional(),
  data: z.string().trim().min(1, "Content is required").max(2000),
  fgColor: z.string().regex(hexColor),
  bgColor: z.string().regex(hexColor),
  size: z.number().int().min(128).max(1024),
  level: z.enum(errorCorrectionLevels),
  logoDataUrl: z
    .string()
    .startsWith("data:image/")
    .max(500_000, "Logo image is too large")
    .optional(),
});

export type QrFormValues = z.infer<typeof qrFormSchema>;
