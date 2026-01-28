// =========================================
// POCKET PAY - CORS CONFIGURATION
// Environment-aware CORS headers
// =========================================

/**
 * Get CORS headers based on environment and request origin
 * In production: restrict to allowed domains
 * In development: allow localhost
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins()
  
  // Determine the allowed origin for this request
  let allowedOrigin = allowedOrigins[0] // Default to first allowed origin
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowedOrigin = requestOrigin
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Get list of allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = []
  
  // Always allow the preview and production Lovable domains
  origins.push('https://id-preview--bf010dab-705c-43c8-aeec-b4776f85a038.lovable.app')
  
  // Add custom domain if configured
  const customOrigin = Deno.env.get('ALLOWED_ORIGIN')
  if (customOrigin) {
    origins.push(customOrigin)
  }
  
  // Add any published domain
  origins.push('https://bf010dab-705c-43c8-aeec-b4776f85a038.lovable.app')
  
  // Allow localhost in development
  const environment = Deno.env.get('ENVIRONMENT') || 'development'
  if (environment === 'development') {
    origins.push('http://localhost:5173')
    origins.push('http://localhost:8080')
    origins.push('http://localhost:3000')
  }
  
  return origins
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(requestOrigin?: string | null): Response {
  return new Response(null, { 
    status: 204,
    headers: getCorsHeaders(requestOrigin) 
  })
}
