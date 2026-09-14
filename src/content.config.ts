import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog', retainBody: true }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    hero: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const scripts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/scripts', retainBody: true }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    downloads: z.array(z.string()).default([]),
    hero: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, scripts };
