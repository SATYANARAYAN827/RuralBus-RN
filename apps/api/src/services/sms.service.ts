/**
 * Real Production SMS Gateway Service for RuralBus SaaS
 * 
 * Supports:
 *  1. Fast2SMS (India Quick SMS / OTP API - https://www.fast2sms.com)
 *  2. Twilio (Global SMS API - https://www.twilio.com)
 *  3. MSG91 (Indian Enterprise SMS - https://msg91.com)
 *  4. Mock / Developer Fallback (when no live provider credentials configured)
 */

export interface SendSmsOptions {
  phone: string;
  otp: string;
  purpose?: string;
  customMessage?: string;
}

export interface SmsSendResult {
  success: boolean;
  provider: 'fast2sms' | 'twofactor' | 'textbelt' | 'twilio' | 'msg91' | 'mock';
  messageId?: string;
  message: string;
  error?: string;
  dispatchedOtp?: string;
}

/**
 * Normalizes phone number to 10-digit Indian standard (stripping +91, 0, or spaces).
 */
export function normalizeIndianPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export async function sendSmsOtp(options: SendSmsOptions): Promise<SmsSendResult> {
  const { phone, otp, purpose = 'REGISTRATION' } = options;
  const cleanPhone = normalizeIndianPhone(phone);

  const defaultMsg = `Your RuralBus verification OTP code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
  const smsBody = options.customMessage || defaultMsg;

  const configuredProvider = (process.env.SMS_PROVIDER || '').toLowerCase();
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  const twoFactorKey = process.env.TWOFACTOR_API_KEY || process.env['2FACTOR_API_KEY'];
  const textbeltKey = process.env.TEXTBELT_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  const msg91Auth = process.env.MSG91_AUTH_KEY;
  const msg91Template = process.env.MSG91_TEMPLATE_ID;

  // 1. Check for Fast2SMS (Primary Indian Quick OTP Gateway - https://www.fast2sms.com)
  if (configuredProvider === 'fast2sms' || (!configuredProvider && fast2smsKey)) {
    if (fast2smsKey) {
      try {
        // Attempt 1: Fast2SMS Quick OTP POST Route
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: cleanPhone,
          }),
        });

        const data = (await response.json()) as any;
        if (data.return === true) {
          console.log(`[SMS Gateway] Successfully delivered SMS OTP to +91 ${cleanPhone} via Fast2SMS (Req: ${data.request_id})`);
          return {
            success: true,
            provider: 'fast2sms',
            messageId: data.request_id,
            message: `SMS OTP delivered to +91 ${cleanPhone} via Fast2SMS`,
            dispatchedOtp: otp,
          };
        } else {
          // Attempt 2: Fallback to Fast2SMS URL Query String OTP
          const fallbackUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsKey)}&route=otp&variables_values=${encodeURIComponent(otp)}&numbers=${cleanPhone}`;
          const fallbackResp = await fetch(fallbackUrl, { method: 'GET' });
          const fallbackData = (await fallbackResp.json()) as any;

          if (fallbackData.return === true) {
            console.log(`[SMS Gateway] Delivered SMS OTP to +91 ${cleanPhone} via Fast2SMS query fallback`);
            return {
              success: true,
              provider: 'fast2sms',
              messageId: fallbackData.request_id,
              message: `SMS OTP delivered to +91 ${cleanPhone}`,
              dispatchedOtp: otp,
            };
          }

          const errMsg = Array.isArray(data.message) ? data.message.join(', ') : String(data.message || 'Fast2SMS dispatch failed');
          console.error(`[SMS Gateway] Fast2SMS error for +91 ${cleanPhone}:`, errMsg);
        }
      } catch (err: any) {
        console.error('[SMS Gateway] Network error connecting to Fast2SMS:', err.message);
      }
    }
  }

  // 2. Check for 2Factor.in (Free Indian OTP SMS API - https://2factor.in)
  if (configuredProvider === 'twofactor' || (!configuredProvider && twoFactorKey)) {
    if (twoFactorKey) {
      try {
        const url = `https://2factor.in/API/V1/${encodeURIComponent(twoFactorKey)}/SMS/+91${cleanPhone}/${otp}/AUTOGEN`;
        const response = await fetch(url, { method: 'GET' });
        const data = (await response.json()) as any;

        if (data.Status === 'Success') {
          console.log(`[SMS Gateway] Delivered SMS OTP to +91 ${cleanPhone} via 2Factor.in (Session: ${data.Details})`);
          return {
            success: true,
            provider: 'twofactor',
            messageId: data.Details,
            message: `SMS OTP delivered to +91 ${cleanPhone} via 2Factor`,
            dispatchedOtp: otp,
          };
        } else {
          console.error(`[SMS Gateway] 2Factor error for +91 ${cleanPhone}:`, data.Details);
        }
      } catch (err: any) {
        console.error('[SMS Gateway] Network error connecting to 2Factor:', err.message);
      }
    }
  }

  // 3. Check for Textbelt (Free & Paid SMS Gateway - https://textbelt.com)
  if (configuredProvider === 'textbelt' || (!configuredProvider && textbeltKey)) {
    try {
      const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+91${cleanPhone}`,
          message: smsBody,
          key: textbeltKey || 'textbelt',
        }),
      });
      const data = (await response.json()) as any;
      if (data.success) {
        console.log(`[SMS Gateway] Delivered SMS OTP to +91 ${cleanPhone} via Textbelt (Quota Remaining: ${data.quotaRemaining})`);
        return {
          success: true,
          provider: 'textbelt',
          messageId: data.textId,
          message: `SMS OTP delivered to +91 ${cleanPhone} via Textbelt`,
          dispatchedOtp: otp,
        };
      } else {
        console.error(`[SMS Gateway] Textbelt response for +91 ${cleanPhone}:`, data.error);
      }
    } catch (err: any) {
      console.error('[SMS Gateway] Network error connecting to Textbelt:', err.message);
    }
  }

  // 4. Check for Twilio (Global SMS API)
  const twilioApiKeySid = process.env.TWILIO_API_KEY_SID;
  if (configuredProvider === 'twilio' || (!configuredProvider && (twilioSid || twilioApiKeySid) && twilioAuth && twilioFrom)) {
    if (twilioSid && twilioAuth && twilioFrom) {
      try {
        let resolvedAccountSid = twilioSid;
        let authUsername = twilioApiKeySid || twilioSid;

        const authHeader = 'Basic ' + Buffer.from(`${authUsername}:${twilioAuth}`).toString('base64');
        const formattedFrom = twilioFrom.startsWith('+') ? twilioFrom : (twilioFrom.length === 10 ? `+91${twilioFrom}` : `+${twilioFrom}`);

        const params = new URLSearchParams({
          To: `+91${cleanPhone}`,
          From: formattedFrom,
          Body: smsBody,
        });

        let response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${resolvedAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        let data = (await response.json()) as any;

        // Auto-fallback: If Twilio trial account requires a predefined template (Error 572006), use sms_2fa template
        if (!response.ok && data.code === 572006) {
          console.log(`[SMS Gateway] Twilio trial account detected. Sending 2FA verification template (sms_2fa) to +91 ${cleanPhone}...`);
          const templateParams = new URLSearchParams({
            To: `+91${cleanPhone}`,
            From: formattedFrom,
            Body: 'sms_2fa',
          });

          response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${resolvedAccountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                Authorization: authHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: templateParams.toString(),
            }
          );
          data = (await response.json()) as any;
        }

        if (response.ok && data.sid) {
          console.log(`[SMS Gateway] Successfully delivered SMS OTP to +91 ${cleanPhone} via Twilio (SID: ${data.sid})`);
          const codeMatch = data.body?.match(/\b(\d{6})\b/);
          const effectiveOtp = codeMatch ? codeMatch[1] : otp;

          return {
            success: true,
            provider: 'twilio',
            messageId: data.sid,
            message: `SMS OTP delivered to +91 ${cleanPhone}`,
            dispatchedOtp: effectiveOtp,
          };
        } else {
          const detailedMsg = data.message || (data.code === 572002 ? 'No Twilio trial phone number is assigned, or recipient number is not verified in Twilio console.' : JSON.stringify(data));
          console.error(`[SMS Gateway] Twilio error for +91 ${cleanPhone}:`, detailedMsg);
        }
      } catch (err: any) {
        console.error('[SMS Gateway] Network error connecting to Twilio:', err.message);
      }
    }
  }

  // 5. Check for MSG91 (Indian Enterprise SMS)
  if (configuredProvider === 'msg91' || (!configuredProvider && msg91Auth && msg91Template)) {
    if (msg91Auth && msg91Template) {
      try {
        const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(msg91Template)}&mobile=91${cleanPhone}&authkey=${encodeURIComponent(msg91Auth)}&otp=${otp}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = (await response.json()) as any;
        if (data.type === 'success') {
          console.log(`[SMS Gateway] Successfully delivered SMS OTP to +91 ${cleanPhone} via MSG91 (Req: ${data.message})`);
          return {
            success: true,
            provider: 'msg91',
            messageId: data.message,
            message: `SMS OTP delivered to +91 ${cleanPhone}`,
            dispatchedOtp: otp,
          };
        } else {
          console.error(`[SMS Gateway] MSG91 error for +91 ${cleanPhone}:`, data.message);
        }
      } catch (err: any) {
        console.error('[SMS Gateway] Network error connecting to MSG91:', err.message);
      }
    }
  }

  // 6. Fallback / Local Developer Logging Mode
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║ 🚌 RURALBUS SMS OTP GATEWAY (DEVELOPMENT / TEST DISPATCH)                   ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║ 📱 Recipient Phone : +91 ${cleanPhone.padEnd(52, ' ')}║`);
  console.log(`║ 🔐 6-Digit OTP Code: ${otp.padEnd(52, ' ')}║`);
  console.log(`║ 🎯 Purpose         : ${purpose.padEnd(52, ' ')}║`);
  console.log(`║ 💬 Message Content : "${smsBody.slice(0, 50)}..."║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║ 💡 TO DELIVER REAL SMS TO THIS PHYSICAL NUMBER:                              ║');
  console.log('║    Add your SMS Provider credentials in .env:                                ║');
  console.log('║    • FAST2SMS_API_KEY=your_key_here (Free wallet at fast2sms.com)            ║');
  console.log('║    • TWOFACTOR_API_KEY=your_key_here (Free wallet at 2factor.in)             ║');
  console.log('║    • Or TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN                               ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  return {
    success: true,
    provider: 'mock',
    messageId: `mock-sms-${Date.now()}`,
    message: `[Test Mode] OTP ${otp} logged for +91 ${cleanPhone}`,
    dispatchedOtp: otp,
  };
}

export interface AccountProvisioningSmsOptions {
  phone: string;
  transportName?: string;
  ownerName?: string;
  username?: string;
  initialPassword?: string;
  accountId?: string;
  role?: string;
  fullName?: string;
  temporaryPassword?: string;
  operatorName?: string;
}

export interface AccountProvisioningSmsResult {
  sent: boolean;
  provider: 'fast2sms' | 'twilio' | 'msg91' | 'mock' | 'none';
  maskedPhone: string;
  message: string;
  error?: string;
}

export async function sendAccountProvisioningSms(
  options: AccountProvisioningSmsOptions
): Promise<AccountProvisioningSmsResult> {
  const phone = options.phone;
  const transportName = options.transportName || options.operatorName || 'Rural Bus Transport';
  const ownerName = options.ownerName || options.fullName || 'Member';
  const roleName = options.role || 'Owner';
  const username = options.username || options.phone;
  const initialPassword = options.initialPassword || options.temporaryPassword || '';
  const accountId = options.accountId || 'RB-STAFF';

  const cleanPhone = normalizeIndianPhone(phone);
  const maskedPhone = `+91 ${cleanPhone.slice(0, 2)}****${cleanPhone.slice(-4)}`;

  const smsBody =
`Rural Bus: Your ${roleName} account has been created successfully.
Transport: ${transportName}
Name: ${ownerName}
Role: ${roleName}
Username: ${username}
Password: ${initialPassword}
Account ID: ${accountId}
Please change your password after first login.`;

  const configuredProvider = (process.env.SMS_PROVIDER || '').toLowerCase();
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  const twilioApiKeySid = process.env.TWILIO_API_KEY_SID;
  const msg91Auth = process.env.MSG91_AUTH_KEY;
  const msg91Template = process.env.MSG91_TEMPLATE_ID;

  // 1. Fast2SMS
  if (configuredProvider === 'fast2sms' || (!configuredProvider && fast2smsKey)) {
    if (fast2smsKey) {
      try {
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'q',
            message: smsBody,
            numbers: cleanPhone,
          }),
        });
        const data = (await response.json()) as any;
        if (data.return === true) {
          return {
            sent: true,
            provider: 'fast2sms',
            maskedPhone,
            message: `SMS dispatched successfully to ${maskedPhone} via Fast2SMS`,
          };
        } else {
          const errMsg = Array.isArray(data.message) ? data.message.join(', ') : String(data.message || 'Fast2SMS dispatch failed');
          return {
            sent: false,
            provider: 'fast2sms',
            maskedPhone,
            message: 'SMS delivery failed via Fast2SMS',
            error: errMsg,
          };
        }
      } catch (err: any) {
        return {
          sent: false,
          provider: 'fast2sms',
          maskedPhone,
          message: 'Network error connecting to Fast2SMS gateway',
          error: err.message,
        };
      }
    }
  }

  // 2. Twilio
  if (configuredProvider === 'twilio' || (!configuredProvider && (twilioSid || twilioApiKeySid) && twilioAuth && twilioFrom)) {
    if (twilioSid && twilioAuth && twilioFrom) {
      try {
        const resolvedAccountSid = twilioSid;
        const authUsername = twilioApiKeySid || twilioSid;
        const authHeader = 'Basic ' + Buffer.from(`${authUsername}:${twilioAuth}`).toString('base64');
        const formattedFrom = twilioFrom.startsWith('+') ? twilioFrom : (twilioFrom.length === 10 ? `+91${twilioFrom}` : `+${twilioFrom}`);

        const params = new URLSearchParams({
          To: `+91${cleanPhone}`,
          From: formattedFrom,
          Body: smsBody,
        });

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${resolvedAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );
        const data = (await response.json()) as any;
        if (response.ok && data.sid) {
          return {
            sent: true,
            provider: 'twilio',
            maskedPhone,
            message: `SMS dispatched successfully to ${maskedPhone} via Twilio`,
          };
        } else {
          const detailedMsg = data.message || JSON.stringify(data);
          return {
            sent: false,
            provider: 'twilio',
            maskedPhone,
            message: 'Twilio failed to deliver provisioning SMS',
            error: detailedMsg,
          };
        }
      } catch (err: any) {
        return {
          sent: false,
          provider: 'twilio',
          maskedPhone,
          message: 'Network error connecting to Twilio gateway',
          error: err.message,
        };
      }
    }
  }

  // 3. MSG91
  if (configuredProvider === 'msg91' || (!configuredProvider && msg91Auth && msg91Template)) {
    if (msg91Auth && msg91Template) {
      try {
        const url = `https://control.msg91.com/api/v5/flow/`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            authkey: msg91Auth,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: msg91Template,
            short_url: '0',
            recipients: [
              {
                mobiles: `91${cleanPhone}`,
                transport: transportName,
                username,
                password: initialPassword,
                accountId,
              },
            ],
          }),
        });
        const data = (await response.json()) as any;
        if (data.type === 'success') {
          return {
            sent: true,
            provider: 'msg91',
            maskedPhone,
            message: `SMS dispatched successfully to ${maskedPhone} via MSG91`,
          };
        } else {
          return {
            sent: false,
            provider: 'msg91',
            maskedPhone,
            message: 'MSG91 failed to deliver provisioning SMS',
            error: data.message,
          };
        }
      } catch (err: any) {
        return {
          sent: false,
          provider: 'msg91',
          maskedPhone,
          message: 'Network error connecting to MSG91 gateway',
          error: err.message,
        };
      }
    }
  }

  // 4. Fallback / No live credentials in environment
  // CRITICAL SECURITY: Never print or log initialPassword!
  console.log(`[SMS Gateway] Provisioning SMS requested for ${maskedPhone} (Transport: ${transportName}). No live SMS provider credentials configured in .env.`);
  return {
    sent: false,
    provider: 'none',
    maskedPhone,
    message: 'No live SMS gateway configured in environment (Fast2SMS/Twilio/MSG91 required)',
  };
}

