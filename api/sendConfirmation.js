// Sends a "submission received" confirmation email to the caregiver for
// a Shoes of Hope registration. Uses Resend's REST API directly so we
// don't need to add an npm dependency.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Least of These Carolinas <notifications@lotcarolinas.com>';
const REPLY_TO = 'info@lotcarolinas.com';

function escape(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderHtml({ caregiverFirstName, childFirstName, submissionId }) {
    const greeting = caregiverFirstName ? `Hi ${escape(caregiverFirstName)},` : 'Hello,';
    const childName = childFirstName ? escape(childFirstName) : 'your child';
    const subId = escape(submissionId);

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Shoes of Hope Registration Received</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:'Poppins','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">We received your Shoes of Hope registration for ${childName}.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f6f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580" style="max-width:580px;width:100%;">

          <tr>
            <td style="background-color:#c22035;padding:28px 32px;border-radius:12px 12px 0 0;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;line-height:1.2;">Least of These Carolinas</p>
              <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Serving families with love</p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#ffffff;padding:36px 32px 24px 32px;border:1px solid #e5e5e5;border-top:none;">
              <h1 style="margin:0 0 8px 0;color:#060511;font-size:24px;font-weight:600;line-height:1.25;">Your registration is in.</h1>
              <p style="margin:0 0 20px 0;color:#86b2d3;font-size:14px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase;">Shoes of Hope</p>

              <p style="margin:0 0 14px 0;color:#4a4a4a;font-size:15px;line-height:24px;">${greeting}</p>
              <p style="margin:0 0 18px 0;color:#4a4a4a;font-size:15px;line-height:24px;">
                Thank you for submitting a Shoes of Hope registration for <strong style="color:#060511;">${childName}</strong>. We've received your form and our team will review it shortly.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f7f7f5;border:1px solid #e5e5e5;border-radius:8px;margin:8px 0 20px 0;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 12px 0;color:#a7a8a3;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">What happens next</p>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td valign="top" width="28" style="padding:2px 0 12px 0;">
                          <div style="width:22px;height:22px;border-radius:50%;background-color:#c22035;color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:22px;">1</div>
                        </td>
                        <td valign="top" style="padding:0 0 12px 8px;color:#4a4a4a;font-size:14px;line-height:22px;">
                          Our team reviews each registration. We'll reach out with next steps and a pickup location.
                        </td>
                      </tr>
                      <tr>
                        <td valign="top" width="28" style="padding:2px 0 0 0;">
                          <div style="width:22px;height:22px;border-radius:50%;background-color:#a7a8a3;color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:22px;">2</div>
                        </td>
                        <td valign="top" style="padding:0 0 0 8px;color:#4a4a4a;font-size:14px;line-height:22px;">
                          Submitting this form does <strong>not</strong> guarantee a spot. We confirm spots once we have stock that matches the child's size.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px 0;color:#a7a8a3;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Submission ID</p>
              <p style="margin:0 0 20px 0;color:#060511;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:14px;">${subId}</p>

              <p style="margin:0;color:#4a4a4a;font-size:14px;line-height:22px;">
                Questions? Just reply to this email, or reach us at <a href="mailto:${REPLY_TO}" style="color:#c22035;text-decoration:none;font-weight:600;">${REPLY_TO}</a>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#ffffff;padding:20px 32px 28px 32px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;">
              <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 16px 0;" />
              <p style="margin:0 0 6px 0;color:#a7a8a3;font-size:12px;line-height:18px;text-align:center;">
                Least of These Carolinas &middot; <a href="https://lotcarolinas.com" style="color:#a7a8a3;text-decoration:underline;">lotcarolinas.com</a>
              </p>
              <p style="margin:0;color:#a7a8a3;font-size:12px;line-height:18px;text-align:center;">
                You received this email because you submitted a Shoes of Hope registration. If this wasn't you, contact us.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendConfirmationEmail({ to, caregiverFirstName, childFirstName, submissionId }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return { success: false, error: 'RESEND_API_KEY not configured' };
    }
    if (!to) {
        return { success: false, error: 'No recipient email provided' };
    }

    const payload = {
        from: FROM_ADDRESS,
        to: [to],
        reply_to: REPLY_TO,
        subject: 'We received your Shoes of Hope registration',
        html: renderHtml({ caregiverFirstName, childFirstName, submissionId }),
    };

    try {
        const res = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            return { success: false, error: `Resend ${res.status}: ${text}` };
        }

        const data = await res.json();
        return { success: true, id: data.id };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = { sendConfirmationEmail };
