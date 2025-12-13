import { z } from "zod";

const OverpassElementTag = z.object({
  name: z.string().optional(),
  ele: z.coerce.number().optional(),
  natural: z.string(),
});

const OverpassElement = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number().nonnegative(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  tags: OverpassElementTag,
});

export const OverpassResponse = z.object({
  version: z.number().nonnegative(),
  generator: z.string(),
  elements: OverpassElement.array(),
});
