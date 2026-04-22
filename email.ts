// SendGrid integration for sending transactional emails
import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email};
}

async function getUncachableSendGridClient() {
  const {apiKey, email} = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export async function sendInvitationEmail(
  clientEmail: string,
  businessName: string,
  invitationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const appUrl = process.env.EXPO_PUBLIC_DOMAIN 
      ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
      : 'https://your-app-url.replit.app';
    
    const invitationLink = `${appUrl}/set-password?token=${invitationToken}`;
    
    const msg = {
      to: clientEmail,
      from: fromEmail,
      subject: 'Welcome to Blossom and Bloom Marketing!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #FAFAF8;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #FF6B35; font-size: 28px; margin: 0 0 8px 0;">Blossom and Bloom</h1>
                <p style="color: #666; font-size: 14px; margin: 0;">Marketing Made Simple</p>
              </div>
              
              <h2 style="color: #333; font-size: 22px; margin: 0 0 16px 0;">Welcome, ${businessName}!</h2>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                You've been invited to join Blossom and Bloom Marketing. We're excited to help you create amazing content for your social media!
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Click the button below to set up your password and get started:
              </p>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${invitationLink}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                  Set Up Your Password
                </a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                This invitation link will expire in 48 hours. If you have any questions, please contact us.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Blossom and Bloom Marketing<br>
                kate@blossomandbloommarketing.com | 01752 374533
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await client.send(msg);

    console.log('Invitation email sent successfully to:', clientEmail);
    return { success: true };
  } catch (err: any) {
    console.error('Error sending invitation email:', err);
    return { success: false, error: err.message };
  }
}

export async function resendInvitationEmail(
  clientEmail: string,
  businessName: string,
  invitationToken: string
): Promise<{ success: boolean; error?: string }> {
  return sendInvitationEmail(clientEmail, businessName, invitationToken);
}

export async function sendPasswordResetEmail(
  clientEmail: string,
  businessName: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const appUrl = process.env.EXPO_PUBLIC_DOMAIN 
      ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
      : 'https://your-app-url.replit.app';
    
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
    
    const msg = {
      to: clientEmail,
      from: fromEmail,
      subject: 'Reset Your Password - Blossom and Bloom Marketing',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #FAFAF8;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #FF6B35; font-size: 28px; margin: 0 0 8px 0;">Blossom and Bloom</h1>
                <p style="color: #666; font-size: 14px; margin: 0;">Marketing Made Simple</p>
              </div>
              
              <h2 style="color: #333; font-size: 22px; margin: 0 0 16px 0;">Hi ${businessName}!</h2>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                This link will expire in 1 hour for security reasons.
              </p>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Blossom and Bloom Marketing<br>
                kate@blossomandbloommarketing.com | 01752 374533
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await client.send(msg);

    console.log('Password reset email sent successfully to:', clientEmail);
    return { success: true };
  } catch (err: any) {
    console.error('Error sending password reset email:', err);
    return { success: false, error: err.message };
  }
}

export async function sendRejectionNotificationEmail(
  postCaption: string,
  platform: string,
  scheduledDate: string,
  clientName: string,
  feedback: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const msg = {
      to: 'kate@blossomandbloommarketing.com',
      from: fromEmail,
      subject: `Post Rejected by ${clientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #FAFAF8;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #FF6B35; font-size: 28px; margin: 0 0 8px 0;">Blossom and Bloom</h1>
                <p style="color: #666; font-size: 14px; margin: 0;">Marketing Made Simple</p>
              </div>
              
              <div style="background-color: #FFEBEE; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h2 style="color: #E53935; font-size: 18px; margin: 0 0 8px 0;">Post Rejected</h2>
                <p style="color: #555; font-size: 14px; margin: 0;">A scheduled post has been rejected by ${clientName}</p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h3 style="color: #333; font-size: 16px; margin: 0 0 12px 0;">Post Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #eee;">Platform</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; text-align: right;">${platform}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #eee;">Scheduled For</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; text-align: right;">${scheduledDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #eee;">Client</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; text-align: right;">${clientName}</td>
                  </tr>
                </table>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h3 style="color: #333; font-size: 16px; margin: 0 0 12px 0;">Caption</h3>
                <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px;">
                  <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.6;">${postCaption || 'No caption'}</p>
                </div>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h3 style="color: #E53935; font-size: 16px; margin: 0 0 12px 0;">Client Feedback</h3>
                <div style="background-color: #FFEBEE; border-radius: 8px; padding: 16px; border-left: 4px solid #E53935;">
                  <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.6; font-style: italic;">"${feedback}"</p>
                </div>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Blossom and Bloom Marketing<br>
                kate@blossomandbloommarketing.com | 01752 374533
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await client.send(msg);

    console.log('Rejection notification email sent successfully');
    return { success: true };
  } catch (err: any) {
    console.error('Error sending rejection notification email:', err);
    return { success: false, error: err.message };
  }
}

export async function sendApprovalReminderEmail(
  clientEmail: string,
  businessName: string,
  postCaption: string,
  platform: string,
  scheduledDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const appUrl = process.env.EXPO_PUBLIC_DOMAIN 
      ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
      : 'https://your-app-url.replit.app';
    
    const msg = {
      to: clientEmail,
      from: fromEmail,
      subject: 'Action Required: Approve Your Scheduled Post',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #FAFAF8;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #FF6B35; font-size: 28px; margin: 0 0 8px 0;">Blossom and Bloom</h1>
                <p style="color: #666; font-size: 14px; margin: 0;">Marketing Made Simple</p>
              </div>
              
              <h2 style="color: #333; font-size: 22px; margin: 0 0 16px 0;">Hi ${businessName}!</h2>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                You have a post scheduled for <strong>${scheduledDate}</strong> on <strong>${platform}</strong> that needs your approval.
              </p>
              
              <div style="background-color: #FFF5ED; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #333; font-size: 14px; margin: 0; font-style: italic;">
                  "${postCaption.length > 100 ? postCaption.substring(0, 100) + '...' : postCaption}"
                </p>
              </div>
              
              <div style="background-color: #FFF3CD; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #FF6B35;">
                <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 600;">
                  You have 24 hours to approve or reject this post. If no action is taken, it will be automatically approved.
                </p>
              </div>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Open the app to review and approve your scheduled content.
              </p>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                  Open App
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Blossom and Bloom Marketing<br>
                kate@blossomandbloommarketing.com | 01752 374533
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await client.send(msg);

    console.log('Approval reminder email sent successfully to:', clientEmail);
    return { success: true };
  } catch (err: any) {
    console.error('Error sending approval reminder email:', err);
    return { success: false, error: err.message };
  }
}
