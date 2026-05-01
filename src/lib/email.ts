import { Resend } from 'resend'

export async function sendMagicLinkEmail(opts: {
  to: string
  magicLink: string
  resendApiKey: string
}): Promise<void> {
  const resend = new Resend(opts.resendApiKey)
  await resend.emails.send({
    from: 'TaxVett <noreply@taxvett.com>',
    to: opts.to,
    subject: 'Your TaxVett login link',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="margin-bottom:8px">Sign in to TaxVett</h2>
        <p style="color:#555;margin-bottom:24px">Click the button below to sign in. The link expires in 15 minutes.</p>
        <a href="${opts.magicLink}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Sign in</a>
        <p style="color:#999;font-size:12px;margin-top:32px">If you didn't request this, you can safely ignore it.</p>
      </div>
    `,
  })
}
