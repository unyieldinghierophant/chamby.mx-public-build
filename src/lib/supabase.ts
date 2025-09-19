import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uiyjmjibshnkhwewtkoz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpeWptamlic2hua2h3ZXd0a296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTg2NDQsImV4cCI6MjA3Mzg3NDY0NH0.V28ZMZ5SkjHNI6oJNyd3Nv7MlT0kKIvyqhsDWucWV7A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)