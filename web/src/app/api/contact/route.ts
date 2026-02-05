import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  const body = await request.json();

  // Validate required fields
  if (!body.name || !body.email || !body.message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    // Fallback for dev/missing config - log and return success
    console.log('Contact form submission (Resend not configured):', {
      name: body.name,
      email: body.email,
      phone: body.phone || 'N/A',
      program: body.program || 'N/A',
      message: body.message,
    });
    return NextResponse.json({ success: true });
  }

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: 'M3NOOVER <noreply@m3noover.com>',
      to: 'chuck@m3noover.com',
      replyTo: body.email,
      subject: `Contact Form: ${body.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(body.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(body.phone || 'N/A')}</p>
        <p><strong>Program Interest:</strong> ${escapeHtml(body.program || 'N/A')}</p>
        <h3>Message:</h3>
        <p>${escapeHtml(body.message).replace(/\n/g, '<br>')}</p>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send failed:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
