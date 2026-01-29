// =========================================
// POCKET PAY - CORS CONFIGURATION
// Allow all origins for cross-origin requests
// =========================================

/**
 * Standard CORS headers that allow any origin
 */
export function getCorsHeaders(_requestOrigin?: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(_requestOrigin?: string | null): Response {
  return new Response(null, { 
    status: 204,
    headers: getCorsHeaders() 
  })
}
