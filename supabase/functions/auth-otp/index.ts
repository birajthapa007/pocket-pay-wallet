// =========================================
// POCKET PAY - Custom OTP Authentication
// Generates OTP, stores it, and sends email with code + magic link
// =========================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendOtpRequest {
  email: string;
  action: 'signup' | 'login' | 'recovery';
  name?: string;
  username?: string;
}

interface VerifyOtpRequest {
  email: string;
  code: string;
  action: 'signup' | 'login' | 'recovery';
}

// Generate a 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Supabase configuration missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "send") {
      // SEND OTP
      const body: SendOtpRequest = await req.json();
      const { email, action: authAction, name, username } = body;

      if (!email || !email.includes("@")) {
        return new Response(
          JSON.stringify({ error: "Valid email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate OTP code
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing unused codes for this email
      await supabase
        .from("otp_codes")
        .delete()
        .eq("email", email.toLowerCase())
        .is("verified_at", null);

      // Store the new code
      const { error: insertError } = await supabase
        .from("otp_codes")
        .insert({
          email: email.toLowerCase(),
          code,
          action: authAction,
          metadata: { name, username },
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error("Error storing OTP:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate verification code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also trigger Supabase's magic link (for the link option)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: authAction === "signup",
          data: authAction === "signup" ? { name, username } : undefined,
        },
      });

      if (otpError) {
        console.error("Supabase OTP error:", otpError);
        // Don't fail - we still have our custom code
      }

      // Send email via Resend with the code
      const subject = authAction === "signup" 
        ? "Welcome to Pocket Pay - Your Verification Code"
        : authAction === "recovery"
        ? "Reset Your Pocket Pay Password"
        : "Your Pocket Pay Login Code";

      const heading = authAction === "signup"
        ? "Welcome to Pocket Pay! 🎉"
        : authAction === "recovery"
        ? "Password Reset Request"
        : "Sign in to Pocket Pay";

      const description = authAction === "signup"
        ? "You're just one step away from managing your money smarter."
        : authAction === "recovery"
        ? "Use the code below to reset your password."
        : "Use the code below to securely access your wallet.";

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Pocket Pay <onboarding@resend.dev>",
          to: [email],
          subject,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f1419; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 480px; background: linear-gradient(135deg, #161b22 0%, #0f1419 100%); border-radius: 24px; border: 1px solid #30363d; overflow: hidden;">
          
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%); width: 64px; height: 64px; border-radius: 16px; margin-bottom: 24px; line-height: 64px;">
                <span style="font-size: 28px;">💳</span>
              </div>
              <h1 style="margin: 0; color: #f0f6fc; font-size: 24px; font-weight: 700;">${heading}</h1>
              <p style="margin: 12px 0 0; color: #8b949e; font-size: 15px; line-height: 1.5;">${description}</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background: #21262d; border-radius: 16px; padding: 32px; text-align: center; border: 1px solid #30363d;">
                <p style="margin: 0 0 12px; color: #8b949e; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your verification code</p>
                <p style="margin: 0; color: #2dd4bf; font-size: 42px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace;">${code}</p>
                <p style="margin: 16px 0 0; color: #6e7681; font-size: 13px;">This code expires in 1 hour</p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0; color: #6e7681; font-size: 13px; text-align: center;">
                Enter this code in the app to continue. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 40px; background: #161b22; border-top: 1px solid #30363d;">
              <p style="margin: 0; color: #8b949e; font-size: 12px; text-align: center;">
                🔒 Protected by 256-bit encryption
              </p>
            </td>
          </tr>
          
        </table>
        
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
      
      let emailSent = true;
      let emailError: string | null = null;
      
      if (!emailResponse.ok) {
        emailSent = false;
        emailError = emailData.message || "Failed to send email";
        console.error("Resend API error:", emailData);
        // Don't fail - continue with Supabase's managed email as fallback
        // The code is still stored in otp_codes table
      } else {
        console.log(`OTP email sent successfully to ${email}, action: ${authAction}`);
      }

      // Return success with code info for testing when email fails
      // In production, you'd remove the code from the response
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: emailSent 
            ? `Verification code sent to ${email}` 
            : `Code generated. Check your email or use code: ${code}`,
          email_sent: emailSent,
          // Include code for testing when Resend domain isn't verified
          // REMOVE THIS IN PRODUCTION
          ...(emailSent ? {} : { test_code: code }),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "verify") {
      // VERIFY OTP
      const body: VerifyOtpRequest = await req.json();
      const { email, code, action: authAction } = body;

      if (!email || !code) {
        return new Response(
          JSON.stringify({ error: "Email and code are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find the OTP
      const { data: otpData, error: otpError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("code", code)
        .is("verified_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (otpError || !otpData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as verified
      await supabase
        .from("otp_codes")
        .update({ verified_at: new Date().toISOString() })
        .eq("id", otpData.id);

      // Now sign in the user using Supabase Admin API
      const metadata = otpData.metadata as { name?: string; username?: string } || {};

      if (authAction === "signup") {
        // Check if user exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase());

        if (!existingUser) {
          // Create new user
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: email.toLowerCase(),
            email_confirm: true,
            user_metadata: {
              name: metadata.name,
              username: metadata.username,
            },
          });

          if (createError) {
            console.error("User creation error:", createError);
            return new Response(
              JSON.stringify({ error: "Failed to create account" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log("Created new user:", newUser.user?.id);
        }
      }

      // Generate a magic link token for the user to sign in
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email.toLowerCase(),
      });

      if (linkError || !linkData) {
        console.error("Link generation error:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to create login session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract token from the action_link (it's called "token" not "token_hash")
      const actionLink = linkData.properties?.action_link || "";
      const urlObj = new URL(actionLink);
      const token = urlObj.searchParams.get("token");
      
      console.log("Token extracted:", token ? "found" : "not found");
      console.log("Generated token for:", email.toLowerCase());

      return new Response(
        JSON.stringify({ 
          success: true,
          verified: true,
          token: token,
          type: "magiclink",
          email: email.toLowerCase(),
          message: authAction === "signup" ? "Account created successfully" : "Login successful",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use ?action=send or ?action=verify" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: unknown) {
    console.error("Error in auth-otp function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
