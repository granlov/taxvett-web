export async function sendMagicLinkEmail(opts: {
  to: string
  magicLink: string
  resendApiKey: string
}): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.resendApiKey}`,
    },
    body: JSON.stringify({
      from: 'TaxVett <noreply@taxvett.com>',
      to: opts.to,
      subject: 'Your TaxVett login link',
      html: `
        <div style="font-family:'Manrope',Arial,sans-serif;max-width:480px;margin:0 auto;padding:0;background:#ffffff">
          <div style="background:#10233F;padding:24px 32px;border-radius:8px 8px 0 0">
            <span style="font-family:'Manrope',Arial,sans-serif;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Tax<span style="color:#10A6E8">Vett</span></span>
          </div>
          <div style="padding:32px;border:1px solid #e2ecf5;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#10233F">Sign in to TaxVett</h2>
            <p style="color:#4a6278;margin:0 0 28px;font-size:15px;line-height:1.5">Click the button below to sign in. The link expires in 15 minutes.</p>
            <a href="${opts.magicLink}" style="display:inline-block;background:#10A6E8;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:6px;font-weight:700;font-size:15px">Sign in to your account</a>
            <p style="color:#8fa8bc;font-size:12px;margin:32px 0 0;line-height:1.5">If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    }),
  })
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}`)
  }
}
