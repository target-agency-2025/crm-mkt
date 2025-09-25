// Cliente Supabase para integração com backend externo
// Substitua as variáveis abaixo com os dados do seu projeto Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = "https://aeateysowyaaqdymlcra.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlYXRleXNvd3lhYXFkeW1sY3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzQwMzcsImV4cCI6MjA3NDQxMDAzN30.IM8Vd6ohZXUe9TfYJn2DZnASwlO-6xWu0Rbfv3VrxDM"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)