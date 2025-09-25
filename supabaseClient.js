import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aeateysowyaaqdymlcra.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlYXRleXNvd3lhYXFkeW1sY3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzQwMzcsImV4cCI6MjA3NDQxMDAzN30.IM8Vd6ohZXUe9TfYJn2DZnASwlO-6xWu0Rbfv3VrxDM"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)