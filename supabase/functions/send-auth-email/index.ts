// =========================================
// POCKET PAY - Custom Auth Email Function
// Sends verification emails with both magic link AND 6-digit code
// =========================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AuthEmailRequest {
  email: string;
  token: string;  // 6-digit OTP code
  token_hash: string;
  redirect_to: string;
  email_action_type: 'signup' | 'login' | 'magiclink' | 'recovery' | 'email_change';
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: AuthEmailRequest = await req.json();
    const { email, token, token_hash, redirect_to, email_action_type } = payload;

    console.log(`Processing ${email_action_type} email for ${email}`);

    // Build the magic link URL
    const magicLink = `${redirect_to}?token_hash=${token_hash}&type=${email_action_type === 'recovery' ? 'recovery' : 'magiclink'}`;

    // Determine email content based on action type
    let subject: string;
    let heading: string;
    let description: string;

    switch (email_action_type) {
      case 'signup':
        subject = "Welcome to Pocket Pay - Verify Your Account";
        heading = "Welcome to Pocket Pay! 🎉";
        description = "You're just one step away from managing your money smarter. Use the code below or click the button to verify your account.";
        break;
      case 'login':
      case 'magiclink':
        subject = "Your Pocket Pay Login Code";
        heading = "Sign in to Pocket Pay";
        description = "Use the code below or click the button to securely access your wallet.";
        break;
      case 'recovery':
        subject = "Reset Your Pocket Pay Password";
        heading = "Password Reset Request";
        description = "Use the code below or click the button to reset your password. If you didn't request this, you can safely ignore this email.";
        break;
      case 'email_change':
        subject = "Confirm Your New Email - Pocket Pay";
        heading = "Confirm Email Change";
        description = "Use the code below or click the button to confirm your new email address.";
        break;
      default:
        subject = "Your Pocket Pay Verification Code";
        heading = "Verification Required";
        description = "Use the code below or click the button to continue.";
    }

    // Send email using Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pocket Pay <noreply@lovable.app>",
        to: [email],
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f1419; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 480px; background: linear-gradient(135deg, #161b22 0%, #0f1419 100%); border-radius: 24px; border: 1px solid #30363d; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%); width: 64px; height: 64px; border-radius: 16px; margin-bottom: 24px;">
                <table role="presentation" width="64" height="64">
                  <tr>
                    <td align="center" valign="middle">
                      <span style="font-size: 28px;">💳</span>
                    </td>
                  </tr>
                </table>
              </div>
              <h1 style="margin: 0; color: #f0f6fc; font-size: 24px; font-weight: 700;">${heading}</h1>
              <p style="margin: 12px 0 0; color: #8b949e; font-size: 15px; line-height: 1.5;">${description}</p>
            </td>
          </tr>
          
          <!-- Verification Code -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <div style="background: #21262d; border-radius: 16px; padding: 24px; text-align: center; border: 1px solid #30363d;">
                <p style="margin: 0 0 8px; color: #8b949e; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
                <p style="margin: 0; color: #2dd4bf; font-size: 36px; font-weight: 800; letter-spacing: 8px; font-family: 'Courier New', monospace;">${token}</p>
                <p style="margin: 12px 0 0; color: #6e7681; font-size: 12px;">This code expires in 1 hour</p>
              </div>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="border-top: 1px solid #30363d; font-size: 0; height: 1px;">&nbsp;</td>
                  <td style="padding: 0 12px; color: #6e7681; font-size: 12px; white-space: nowrap;">or</td>
                  <td style="border-top: 1px solid #30363d; font-size: 0; height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Magic Link Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%); color: #0f1419; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                ${email_action_type === 'recovery' ? 'Reset Password' : 'Sign In with One Click'}
              </a>
              <p style="margin: 16px 0 0; color: #6e7681; font-size: 12px;">Click the button above to ${email_action_type === 'recovery' ? 'reset your password' : 'sign in instantly'}</p>
            </td>
          </tr>
          
          <!-- Security Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #161b22; border-top: 1px solid #30363d;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: #8b949e; font-size: 12px;">
                      🔒 Protected by 256-bit encryption
                    </p>
                    <p style="margin: 0; color: #6e7681; font-size: 11px;">
                      If you didn't request this, please ignore this email or contact support.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Footer -->
        <p style="margin: 24px 0 0; color: #6e7681; font-size: 12px;">
          © ${new Date().getFullYear()} Pocket Pay. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, id: emailData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending auth email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
