import { z } from 'zod';

/**
 * Schema for contact links and languages extracted from the CV.
 */
export const ContactDetailsSchema = z.object({
  linkedin: z.string().nullish().transform(v => v ?? null),
  github: z.string().nullish().transform(v => v ?? null),
  website: z.string().nullish().transform(v => v ?? null),
  languages: z.array(z.string()).default([]),
}).default({});

export type ContactDetails = z.infer<typeof ContactDetailsSchema>;

/**
 * Zod schema for validated resume extraction output.
 * Ensures the AI returns structured JSON that exactly maps to these fields.
 */
export const ExtractedProfileSchema = z.object({
  full_name: z.string().nullish().transform(v => v ?? null),
  headline: z.string().nullish().transform(v => v ?? null),
  email: z.string().nullish().transform(v => v ?? null),
  phone: z.string().nullish().transform(v => v ?? null),
  location: z.string().nullish().transform(v => v ?? null),
  summary: z.string().nullish().transform(v => v ?? null),
  skills: z.array(z.string()).default([]),
  work_experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      start: z.string().nullish().transform(v => v ?? null),
      end: z.string().nullish().transform(v => v ?? null),
      description: z.string().nullish().transform(v => v ?? null),
    })
  ).default([]),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string().nullish().transform(v => v ?? null),
      field: z.string().nullish().transform(v => v ?? null),
      start: z.string().nullish().transform(v => v ?? null),
      end: z.string().nullish().transform(v => v ?? null),
    })
  ).default([]),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string().nullish().transform(v => v ?? null),
    })
  ).default([]),
  certifications: z.array(z.string()).default([]),
  contact_details: ContactDetailsSchema,
});

// TypeScript type inference from Zod schema
export type ExtractedProfile = z.infer<typeof ExtractedProfileSchema>;

/**
 * Full database profile row type.
 */
export interface ProfileRow extends ExtractedProfile {
  id: string;
  avatar: string | null;
  resume_uploaded: boolean;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}
