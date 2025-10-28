/**
 * Environment Variables Validation
 * 
 * This file validates required environment variables at build time
 * and provides type-safe access to them.
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().optional(), // For Neon migrations

    // NextAuth
    NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
    NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

    // Node Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Optional: Email
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),

    // Optional: Payment Providers
    PAYSTACK_SECRET_KEY: z.string().optional(),
    PAYSTACK_CALLBACK_URL: z.string().url().optional(),
    PAYPAL_CLIENT_ID: z.string().optional(),
    PAYPAL_CLIENT_SECRET: z.string().optional(),
    PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),

    // Optional: OAuth
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
});

// Public environment variables (available to browser)
const publicEnvSchema = z.object({
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_NAME: z.string().default('Taadiway CRM'),
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().optional(),
});

// Validate environment variables
function validateEnv() {
    // Only validate in server environment
    if (typeof window !== 'undefined') {
        return {
            parsed: publicEnvSchema.parse({
                NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
                NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
                NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
                NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
            }),
            error: null,
        };
    }

    try {
        const parsed = envSchema.parse({
            DATABASE_URL: process.env.DATABASE_URL,
            DIRECT_URL: process.env.DIRECT_URL,
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
            NODE_ENV: process.env.NODE_ENV,
            RESEND_API_KEY: process.env.RESEND_API_KEY,
            EMAIL_FROM: process.env.EMAIL_FROM,
            PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
            PAYSTACK_CALLBACK_URL: process.env.PAYSTACK_CALLBACK_URL,
            PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
            PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
            PAYPAL_MODE: process.env.PAYPAL_MODE,
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
            GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
            GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        });

        return { parsed, error: null };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors
                .map((err) => `${err.path.join('.')}: ${err.message}`)
                .join('\n');

            console.error('❌ Invalid environment variables:\n', errorMessage);

            return { parsed: null, error: errorMessage };
        }

        throw error;
    }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variable access
export function getEnv(key: string): string | undefined {
    if (typeof window !== 'undefined') {
        throw new Error('Cannot access server environment variables in browser');
    }

    if (!env.parsed) return undefined;
    return (env.parsed as any)[key];
}

// Check if specific features are enabled
export const features = {
    email: Boolean(process.env.RESEND_API_KEY),
    paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
    paypal: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    googleAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    githubAuth: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
} as const;

// Log feature availability in development
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    console.log('🔧 Feature availability:');
    Object.entries(features).forEach(([feature, enabled]) => {
        console.log(`  ${enabled ? '✅' : '❌'} ${feature}`);
    });
}
