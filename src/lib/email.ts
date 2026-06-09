export async function sendWelcomeEmail(opts: {
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
      subject: 'Welcome to TaxVett Pro — your login link',
      html: `
        <div style="font-family:'Manrope',Arial,sans-serif;max-width:480px;margin:0 auto;padding:0;background:#ffffff">
          <div style="background:#10233F;padding:24px 32px;border-radius:8px 8px 0 0">
            <span style="font-family:'Manrope',Arial,sans-serif;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Tax<span style="color:#10A6E8">Vett</span></span>
          </div>
          <div style="padding:32px;border:1px solid #e2ecf5;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#10233F">Welcome to TaxVett Pro 🎉</h2>
            <p style="color:#4a6278;margin:0 0 28px;font-size:15px;line-height:1.5">Your account is ready. Click below to sign in — this link is valid for 24 hours.</p>
            <a href="${opts.magicLink}" style="display:inline-block;background:#10A6E8;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:6px;font-weight:700;font-size:15px">Sign in to your dashboard</a>
            <p style="color:#8fa8bc;font-size:12px;margin:32px 0 0;line-height:1.5">Questions? Email <a href="mailto:support@taxvett.com" style="color:#10A6E8">support@taxvett.com</a> — we're happy to help.</p>
          </div>
        </div>
      `,
    }),
  })
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}`)
  }
}

export async function sendMagicLinkEmail(opts: {
  to: string
  magicLink: string
  resendApiKey: string
  otpCode?: string
}): Promise<void> {
  const otpSection = opts.otpCode ? `
            <div style="margin:0 0 28px;padding:20px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;text-align:center">
              <p style="color:#4a6278;margin:0 0 8px;font-size:13px">Or enter this code on the sign-in page</p>
              <div style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:36px;font-weight:700;color:#10233F;letter-spacing:6px">${opts.otpCode}</div>
              <p style="color:#8fa8bc;margin:8px 0 0;font-size:12px">Valid for 10 minutes</p>
            </div>` : ''

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.resendApiKey}`,
    },
    body: JSON.stringify({
      from: 'TaxVett <noreply@taxvett.com>',
      to: opts.to,
      subject: opts.otpCode ? `Your TaxVett login code: ${opts.otpCode}` : 'Your TaxVett login link',
      html: `
        <div style="font-family:'Manrope',Arial,sans-serif;max-width:480px;margin:0 auto;padding:0;background:#ffffff">
          <div style="background:#10233F;padding:24px 32px;border-radius:8px 8px 0 0">
            <span style="font-family:'Manrope',Arial,sans-serif;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Tax<span style="color:#10A6E8">Vett</span></span>
          </div>
          <div style="padding:32px;border:1px solid #e2ecf5;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#10233F">Sign in to TaxVett</h2>
            <p style="color:#4a6278;margin:0 0 28px;font-size:15px;line-height:1.5">Click the button below to sign in, or enter the code on the sign-in page.</p>
            ${otpSection}
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
