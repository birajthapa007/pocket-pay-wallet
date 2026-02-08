// =========================================
// POCKET PAY - Custom OTP Authentication
// Generates OTP, stores it, and sends via email (Resend) or SMS (Twilio)
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
  email?: string;
  phone?: string;
  channel: 'email' | 'sms';
  action: 'signup' | 'login' | 'recovery';
  name?: string;
  username?: string;
  password?: string;
}

interface VerifyOtpRequest {
  email?: string;
  phone?: string;
  channel: 'email' | 'sms';
  code: string;
  action: 'signup' | 'login' | 'recovery';
}

// OTP expires after 30 minutes (generous window)
const OTP_EXPIRY_MS = 30 * 60 * 1000;

// Generate a 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via Twilio WhatsApp using Content Template
async function sendWhatsAppTwilio(to: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
  const contentSid = Deno.env.get("TWILIO_CONTENT_SID") || "HX229f5a04fd0510ce1b071852155d3e75";

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Twilio credentials not configured");
    return { success: false, error: "WhatsApp service not configured" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    // Prefix both To and From with 'whatsapp:' for WhatsApp delivery
    const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const whatsappFrom = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: whatsappTo,
        From: whatsappFrom,
        ContentSid: contentSid,
        ContentVariables: JSON.stringify({ "1": otpCode }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio WhatsApp API error:", data);
      return { success: false, error: data.message || "Failed to send WhatsApp message" };
    }

    console.log(`WhatsApp OTP sent successfully to ${to}, SID: ${data.sid}`);
    return { success: true };
  } catch (err) {
    console.error("Twilio WhatsApp send error:", err);
    return { success: false, error: "Failed to send WhatsApp message" };
  }
}

// Send email via Resend
async function sendEmailResend(
  to: string,
  code: string,
  authAction: string,
  resendApiKey: string
): Promise<{ success: boolean; error?: string }> {
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
      to: [to],
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
    return { success: false, error: "Failed to send verification email" };
  }

  return { success: true };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "send") {
      // ========== SEND OTP ==========
      const body: SendOtpRequest = await req.json();
      const { email, phone, channel, action: authAction, name, username, password } = body;

      // Determine the contact identifier
      const contactEmail = channel === 'email' ? email?.toLowerCase() : null;
      const contactPhone = channel === 'sms' ? phone : null;

      if (channel === 'email' && (!contactEmail || !contactEmail.includes("@"))) {
        return new Response(
          JSON.stringify({ error: "Valid email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (channel === 'sms' && (!contactPhone || contactPhone.length < 10)) {
        return new Response(
          JSON.stringify({ error: "Valid phone number is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate OTP code
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

      // Delete any existing unused codes for this contact
      if (channel === 'email') {
        await supabase
          .from("otp_codes")
          .delete()
          .eq("email", contactEmail!)
          .is("verified_at", null);
      } else {
        await supabase
          .from("otp_codes")
          .delete()
          .eq("phone", contactPhone!)
          .is("verified_at", null);
      }

      // Store the new code
      const insertPayload: Record<string, unknown> = {
        email: contactEmail || `phone_${contactPhone}@placeholder.local`,
        phone: contactPhone || null,
        code,
        action: authAction,
        metadata: { name, username, password, channel },
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        locked_until: null,
      };

      const { data: insertedOtp, error: insertError } = await supabase
        .from("otp_codes")
        .insert(insertPayload)
        .select('id')
        .single();

      if (insertError) {
        console.error("Error storing OTP:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate verification code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send the code via the appropriate channel
      if (channel === 'sms') {
        const whatsappResult = await sendWhatsAppTwilio(contactPhone!, code);

        if (!whatsappResult.success) {
          // Delete the OTP since we couldn't deliver it
          if (insertedOtp?.id) {
            await supabase.from("otp_codes").delete().eq("id", insertedOtp.id);
          }
          return new Response(
            JSON.stringify({ error: whatsappResult.error || "Failed to send WhatsApp message. Please try again." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`OTP WhatsApp sent successfully to ${contactPhone}, action: ${authAction}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Verification code sent via WhatsApp to ${contactPhone}`,
            whatsapp_sent: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Email channel
        if (!resendApiKey) {
          if (insertedOtp?.id) {
            await supabase.from("otp_codes").delete().eq("id", insertedOtp.id);
          }
          return new Response(
            JSON.stringify({ error: "Email service not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const emailResult = await sendEmailResend(contactEmail!, code, authAction, resendApiKey);

        if (!emailResult.success) {
          if (insertedOtp?.id) {
            await supabase.from("otp_codes").delete().eq("id", insertedOtp.id);
          }
          return new Response(
            JSON.stringify({ error: emailResult.error || "Failed to send verification code. Please try again." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`OTP email sent successfully to ${contactEmail}, action: ${authAction}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Verification code sent to ${contactEmail}`,
            email_sent: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

    } else if (action === "verify") {
      // ========== VERIFY OTP ==========
      const body: VerifyOtpRequest = await req.json();
      const { email, phone, channel, code, action: authAction } = body;

      if (!code) {
        return new Response(
          JSON.stringify({ error: "Verification code is required" }),
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

      // Build query to find OTP record
      let query = supabase
        .from("otp_codes")
        .select("*")
        .is("verified_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (channel === 'sms' && phone) {
        query = query.eq("phone", phone);
      } else if (email) {
        query = query.eq("email", email.toLowerCase());
      } else {
        return new Response(
          JSON.stringify({ error: "Email or phone is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: otpRecord, error: findError } = await query.maybeSingle();

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

      // Clear any old locks
      if (otpRecord.locked_until) {
        await supabase
          .from("otp_codes")
          .update({ locked_until: null, attempts: 0 })
          .eq("id", otpRecord.id);
      }

      // Check if code matches
      if (otpRecord.code !== code) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return new Response(
          JSON.stringify({ error: "Invalid code. Please check and try again, or request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Code is valid - mark as verified
      await supabase
        .from("otp_codes")
        .update({ verified_at: new Date().toISOString() })
        .eq("id", otpRecord.id);

      // Get metadata from OTP record
      const metadata = otpRecord.metadata as { name?: string; username?: string; password?: string; channel?: string } || {};

      // Determine the user's email for auth system
      // For phone users, we need to handle differently
      const isPhoneAuth = channel === 'sms' || metadata.channel === 'sms';
      const normalizedEmail = isPhoneAuth
        ? `phone_${phone}@placeholder.local`
        : (email || otpRecord.email).toLowerCase();
      const userPhone = isPhoneAuth ? phone : null;

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      let existingUser = existingUsers?.users?.find(u => {
        if (isPhoneAuth && userPhone) {
          return u.phone === userPhone || u.email === normalizedEmail;
        }
        return u.email?.toLowerCase() === normalizedEmail;
      });

      if (authAction === "signup" && !existingUser) {
        // Create new user
        const createUserPayload: Record<string, unknown> = {
          email_confirm: true,
          user_metadata: {
            name: metadata.name,
            username: metadata.username,
          },
        };

        if (isPhoneAuth && userPhone) {
          // For phone auth, set both email (placeholder) and phone
          createUserPayload.email = normalizedEmail;
          createUserPayload.phone = userPhone;
          createUserPayload.phone_confirm = true;
        } else {
          createUserPayload.email = normalizedEmail;
        }

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
        console.log("Created new user:", existingUser?.id, isPhoneAuth ? `phone: ${userPhone}` : `email: ${normalizedEmail}`);

        // Update profile with phone number if phone auth
        if (isPhoneAuth && userPhone && existingUser) {
          await supabase
            .from("profiles")
            .update({ phone: userPhone })
            .eq("id", existingUser.id);
        }
      }

      if (!existingUser) {
        return new Response(
          JSON.stringify({ error: "No account found. Please sign up first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate session via magic link
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: existingUser.email || normalizedEmail,
      });

      if (linkError || !linkData) {
        console.error("Link generation error:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to create login session. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const actionLink = linkData.properties?.action_link;
      if (!actionLink) {
        console.error("No action link generated");
        return new Response(
          JSON.stringify({ error: "Failed to create login session. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const linkUrl = new URL(actionLink);
      const tokenHash = linkUrl.searchParams.get('token_hash') || linkData.properties?.hashed_token;

      console.log("Generated session for:", existingUser.email || userPhone);

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          token_hash: tokenHash,
          type: "magiclink",
          email: existingUser.email || normalizedEmail,
          user_id: existingUser.id,
          message: authAction === "signup" ? "Account created successfully" : "Login successful",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "admin-set-password") {
      const body = await req.json();
      const { user_id, password } = body;

      if (!user_id || !password) {
        return new Response(
          JSON.stringify({ error: "user_id and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user_id, {
        password: password,
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update password" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully" }),
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
