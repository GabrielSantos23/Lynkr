import Joi from "joi";

// User validation schemas
export const userCreateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).optional(),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Folder validation schemas
export const folderCreateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  icon: Joi.string().max(10).optional().default("📁"),
  allow_duplicate: Joi.boolean().optional().default(true),
  is_shared: Joi.boolean().optional().default(false),
});

// Bookmark validation schemas
export const tagSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .required(),
});

export const bookmarkCreateSchema = Joi.object({
  url: Joi.string().uri().required(),
  title: Joi.string().min(1).max(200).required(),
  folder_id: Joi.string().uuid().required(),
  favicon_url: Joi.string().uri().optional(),
  og_image_url: Joi.string().uri().optional(),
  description: Joi.string().max(500).optional(),
  is_pinned: Joi.boolean().optional().default(false),
  tags: Joi.array().items(tagSchema).optional().default([]),
});

// Validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        detail: error.details[0]?.message || "Validation error",
        field: error.details[0]?.path[0] || "unknown",
      });
    }

    req.body = value;
    next();
  };
};
