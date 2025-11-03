/**
 * Supabase Client Fallback
 *
 * This file is used when VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY
 * environment variables are not set during build.
 *
 * It provides a stub client that throws meaningful errors when used,
 * helping developers identify missing configuration.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create a stub client that will throw errors if used without proper configuration
const MISSING_CONFIG_ERROR = `
⚠️ Supabase configuration missing!

Please set the following environment variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Check your .env file or deployment configuration.
`;

// Dummy values to create a client instance
const DUMMY_URL = 'https://placeholder.supabase.co';
const DUMMY_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

// Create base client
const baseClient = createClient<Database>(DUMMY_URL, DUMMY_KEY);

// Proxy handler to intercept all method calls and throw configuration error
const handler: ProxyHandler<SupabaseClient<Database>> = {
  get(target, prop) {
    // Allow certain safe properties
    if (prop === 'constructor' || prop === 'toString' || prop === Symbol.toStringTag) {
      return target[prop as keyof typeof target];
    }

    // For all other properties, return a function that throws
    return () => {
      console.error(MISSING_CONFIG_ERROR);
      throw new Error('Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    };
  }
};

// Export proxied client
export const supabase = new Proxy(baseClient, handler);

// Warn in console
console.warn('⚠️ Using Supabase fallback client. Configuration is missing!');
