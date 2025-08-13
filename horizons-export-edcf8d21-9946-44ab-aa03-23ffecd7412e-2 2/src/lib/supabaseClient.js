import { createClient } from '@supabase/supabase-js';

// Your actual Supabase credentials.
const supabaseUrl = 'https://xyplbhuqfihdptmffvvp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cGxiaHVxZmloZHB0bWZmdnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTYwNTYsImV4cCI6MjA3MDU3MjA1Nn0.CVMRAMB3M1BtRE_b__f2KEUr0Cm80WpOELbFAFGCtM8';

export const supabase = createClient(supabaseUrl, supabaseKey);