import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    console.log('[health-check] Starting health check...')

    // Check if environment variables are set
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[health-check] Missing environment variables')
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing Supabase environment variables',
          timestamp: new Date().toISOString(),
          checks: {
            env_url: !!supabaseUrl,
            env_key: !!supabaseAnonKey,
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test database connection with a simple query
    const { data: testData, error: testError } = await supabase
      .from('ativo_tipos')
      .select('id')
      .limit(1)

    console.log('[health-check] Database test:', { success: !testError })

    if (testError) {
      console.error('[health-check] Database connection failed:', testError.message)
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Database connection failed',
          error: testError.message,
          timestamp: new Date().toISOString(),
          checks: {
            env_url: true,
            env_key: true,
            db_connection: false,
          }
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // All checks passed
    console.log('[health-check] All checks passed ✓')
    return new Response(
      JSON.stringify({
        status: 'healthy',
        message: 'Supabase connection is working correctly',
        timestamp: new Date().toISOString(),
        checks: {
          env_url: true,
          env_key: true,
          db_connection: true,
        },
        supabase: {
          url_configured: supabaseUrl.includes('xpitekijedfhyizpgzac'),
          project_ref: supabaseUrl.split('.')[0].split('//')[1],
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[health-check] Unexpected error:', error)
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Unexpected error during health check',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
