import { z } from 'zod';

// ─── Contact Details ──────────────────────────────────────────────────────────

/**
 * Contact details sub-schema — optional because many resumes omit social links.
 * Each field is nullish so missing JSON fields don't fail validation.
 */
const contactDetailsInner = z.object({
  linkedin:  z.string().nullable().optional().transform(v => v ?? null),
  github:    z.string().nullable().optional().transform(v => v ?? null),
  website:   z.string().nullable().optional().transform(v => v ?? null),
  languages: z.array(z.string()).default([]),
});

export const ContactDetailsSchema = contactDetailsInner.optional();

export type ContactDetails = {
  linkedin:  string | null;
  github:    string | null;
  website:   string | null;
  languages: string[];
} | undefined;

// ─── Extracted Profile ────────────────────────────────────────────────────────

/**
 * Zod schema for validated resume extraction output.
 * Ensures the AI returns structured JSON that exactly maps to these fields.
 */
export const ExtractedProfileSchema = z.object({
  full_name:       z.string().nullable().optional().transform(v => v ?? null),
  headline:        z.string().nullable().optional().transform(v => v ?? null),
  email:           z.string().nullable().optional().transform(v => v ?? null),
  phone:           z.string().nullable().optional().transform(v => v ?? null),
  location:        z.string().nullable().optional().transform(v => v ?? null),
  summary:         z.string().nullable().optional().transform(v => v ?? null),
  skills:          z.array(z.string()).default([]),
  work_experience: z.array(
    z.object({
      company:     z.string(),
      title:       z.string(),
      start:       z.string().nullable().optional().transform(v => v ?? null),
      end:         z.string().nullable().optional().transform(v => v ?? null),
      description: z.string().nullable().optional().transform(v => v ?? null),
    })
  ).default([]),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string().nullable().optional().transform(v => v ?? null),
      field:  z.string().nullable().optional().transform(v => v ?? null),
      start:  z.string().nullable().optional().transform(v => v ?? null),
      end:    z.string().nullable().optional().transform(v => v ?? null),
    })
  ).default([]),
  projects: z.array(
    z.object({
      name:        z.string(),
      description: z.string().nullable().optional().transform(v => v ?? null),
    })
  ).default([]),
  certifications:  z.array(z.string()).default([]),
  contact_details: ContactDetailsSchema,
});

// TypeScript type inferred from Zod schema
export type ExtractedProfile = z.infer<typeof ExtractedProfileSchema>;

/**
 * Full database profile row type.
 */
export interface ProfileRow extends ExtractedProfile {
  id:                string;
  avatar:            string | null;
  resume_uploaded:   boolean;
  profile_completed: boolean;
  created_at:        string;
  updated_at:        string;
}

