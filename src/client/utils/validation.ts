import { z } from 'zod';

/**
 * Zod schemas for runtime type validation
 * Ensures data integrity across the application
 */

// Element validation
export const SlideElementSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'shape', 'image']),
  x: z.number().min(0).max(1920),
  y: z.number().min(0).max(1080),
  width: z.number().min(10).max(1920),
  height: z.number().min(10).max(1080),
  content: z.string().optional(),
  backgroundColor: z.string().optional(),
  color: z.string().optional(),
  fontSize: z.number().min(8).max(200).optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().min(100).max(900).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  bold: z.boolean().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  opacity: z.number().min(0).max(100).optional(),
  rotation: z.number().min(-360).max(360).optional(),
  locked: z.boolean().optional(),
  visible: z.boolean().optional(),
  shapeType: z.enum(['rectangle', 'circle', 'triangle']).optional(),
  borderRadius: z.number().min(0).max(500).optional(),
  blur: z.number().min(0).max(50).optional(),
  shadow: z.any().optional(),
  animation: z.any().optional(),
  imageUrl: z.string().optional(),
});

// Slide validation
export const SlideSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  elements: z.array(SlideElementSchema),
  background: z.string(),
  backgroundType: z.enum(['color', 'gradient', 'image']),
  backgroundImage: z.string().optional(),
  duration: z.number().min(1).max(300), // 1s to 5 minutes
  audioUrl: z.string().optional(),
  audioText: z.string().optional(),
  transition: z.enum(['fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'none']).optional(),
  transitionDuration: z.number().min(0.1).max(5).optional(),
});

// Project validation
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  slides: z.array(SlideSchema).min(1).max(100), // 1 to 100 slides
  createdAt: z.string(),
  updatedAt: z.string(),
});

// User preferences validation
export const UserPreferencesSchema = z.object({
  theme: z.enum(['dark', 'light']).default('dark'),
  autoSave: z.boolean().default(true),
  autoSaveInterval: z.number().min(1000).max(60000).default(3000),
  showGrid: z.boolean().default(false),
  gridSize: z.number().min(8).max(64).default(24),
  defaultSlideDuration: z.number().min(1).max(60).default(5),
});

// Export types inferred from schemas
export type SlideElement = z.infer<typeof SlideElementSchema>;
export type Slide = z.infer<typeof SlideSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/**
 * Validation helpers
 */
export const validateElement = (data: unknown) => {
  try {
    return {
      success: true,
      data: SlideElementSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Validation failed',
    };
  }
};

export const validateSlide = (data: unknown) => {
  try {
    return {
      success: true,
      data: SlideSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Validation failed',
    };
  }
};

export const validateProject = (data: unknown) => {
  try {
    return {
      success: true,
      data: ProjectSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Validation failed',
    };
  }
};

/**
 * Safe parse with default values
 */
export const safeParseProject = (data: unknown): Project | null => {
  const result = ProjectSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeParseSlide = (data: unknown): Slide | null => {
  const result = SlideSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeParseElement = (data: unknown): SlideElement | null => {
  const result = SlideElementSchema.safeParse(data);
  return result.success ? result.data : null;
};
