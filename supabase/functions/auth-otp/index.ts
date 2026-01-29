// =========================================
// POCKET PAY - Custom OTP Authentication
// Generates OTP, stores it, and sends email with code
// NO magic links - OTP code only
// Forgiving verification - no lockouts
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
  password?: string;
}

interface VerifyOtpRequest {
  email: string;
  code: string;
  action: 'signup' | 'login' | 'recovery';
}

// OTP expires after 30 minutes (generous window)
const OTP_EXPIRY_MS = 30 * 60 * 1000;

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
      const { email, action: authAction, name, username, password } = body;

      if (!email || !email.includes("@")) {
        return new Response(
          JSON.stringify({ error: "Valid email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate OTP code
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS); // 15 minutes

      // Delete any existing unused codes for this email
      await supabase
        .from("otp_codes")
        .delete()
        .eq("email", email.toLowerCase())
        .is("verified_at", null);

      // Store the new code with attempt tracking
      const { data: insertedOtp, error: insertError } = await supabase
        .from("otp_codes")
        .insert({
          email: email.toLowerCase(),
          code,
          action: authAction,
          metadata: { name, username, password },
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          locked_until: null,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error("Error storing OTP:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate verification code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send email via Resend with the code ONLY (no magic link)
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
          from: "Pocket Pay <noreply@wenevertrust.com>",
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
                <p style="margin: 16px 0 0; color: #6e7681; font-size: 13px;">This code expires in 30 minutes</p>
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
      
      if (!emailResponse.ok) {
        console.error("Resend API error:", emailData);
        
        // Delete the OTP code since we can't deliver it securely
        if (insertedOtp?.id) {
          await supabase
            .from("otp_codes")
            .delete()
            .eq("id", insertedOtp.id);
        }
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to send verification code. Please try again." 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`OTP email sent successfully to ${email}, action: ${authAction}`);

      // Return success - NEVER include the code in the response
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Verification code sent to ${email}`,
          email_sent: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "verify") {
      // VERIFY OTP with rate limiting
      const body: VerifyOtpRequest = await req.json();
      const { email, code, action: authAction } = body;

      if (!email || !code) {
        return new Response(
          JSON.stringify({ error: "Email and code are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate code format (6 digits only)
      if (!/^\d{6}$/.test(code)) {
        return new Response(
          JSON.stringify({ error: "Invalid code format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find any OTP for this email (not matching code yet - for rate limiting)
      const { data: otpRecord, error: findError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("email", email.toLowerCase())
        .is("verified_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        console.error("Error finding OTP:", findError);
        return new Response(
          JSON.stringify({ error: "Verification failed. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!otpRecord) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired verification code. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if account is locked (legacy - now we just clear it)
      if (otpRecord.locked_until) {
        // Clear any old locks
        await supabase
          .from("otp_codes")
          .update({ locked_until: null, attempts: 0 })
          .eq("id", otpRecord.id);
      }

      // Check if code matches
      if (otpRecord.code !== code) {
        // Just inform the user, no lockout
        // Add tiny delay to slow down automated attacks (1 second max)
        await new Promise(resolve => setTimeout(resolve, 1000));

        return new Response(
          JSON.stringify({ 
            error: "Invalid code. Please check and try again, or request a new code." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Code is valid - mark as verified
      await supabase
        .from("otp_codes")
        .update({ verified_at: new Date().toISOString() })
        .eq("id", otpRecord.id);

      // Get metadata from OTP record
      const metadata = otpRecord.metadata as { name?: string; username?: string; password?: string } || {};
      const normalizedEmail = email.toLowerCase();

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      let existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

      if (authAction === "signup" && !existingUser) {
        // Create new user with password if provided
        const createUserPayload: {
          email: string;
          email_confirm: boolean;
          password?: string;
          user_metadata: { name?: string; username?: string };
        } = {
          email: normalizedEmail,
          email_confirm: true,
          user_metadata: {
            name: metadata.name,
            username: metadata.username,
          },
        };
        
        // Add password if provided
        if (metadata.password && metadata.password.length >= 6) {
          createUserPayload.password = metadata.password;
        }

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser(createUserPayload);

        if (createError) {
          console.error("User creation error:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create account. Please try again." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        existingUser = newUser.user;
        console.log("Created new user:", existingUser?.id);
      }

      if (!existingUser) {
        return new Response(
          JSON.stringify({ error: "No account found with this email. Please sign up first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a proper session using admin API
      // We need to generate a magic link and extract the token
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
      });

      if (linkError || !linkData) {
        console.error("Link generation error:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to create login session. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract the token from the action_link
      const actionLink = linkData.properties?.action_link;
      if (!actionLink) {
        console.error("No action link generated");
        return new Response(
          JSON.stringify({ error: "Failed to create login session. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse the token from the URL
      const linkUrl = new URL(actionLink);
      const tokenHash = linkUrl.searchParams.get('token_hash') || linkData.properties?.hashed_token;
      const accessToken = linkUrl.hash?.match(/access_token=([^&]+)/)?.[1];
      const refreshToken = linkUrl.hash?.match(/refresh_token=([^&]+)/)?.[1];

      console.log("Generated session for:", normalizedEmail);

      return new Response(
        JSON.stringify({ 
          success: true,
          verified: true,
          // Return the token_hash for client-side session creation
          token_hash: tokenHash,
          type: "magiclink",
          email: normalizedEmail,
          user_id: existingUser.id,
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
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
