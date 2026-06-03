import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Save to database
    let waitlistEntry;
    try {
      waitlistEntry = await prisma.waitlist.create({
        data: { email },
      });
    } catch (error: any) {
      // P2002 is Prisma's unique constraint violation error code
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Email already on waitlist' }, { status: 409 });
      }
      throw error;
    }

    // Premium HTML Email Template
    const emailHtml = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #ffffff; padding: 60px 20px; text-align: center; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
        <h1 style="font-size: 28px; font-weight: 500; margin-bottom: 24px; letter-spacing: -0.02em;">Welcome to Continuum</h1>
        <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 32px; max-width: 480px; margin-left: auto; margin-right: auto;">
          Thank you for joining the private beta waitlist. We are building the future of autonomous AI engineering, and we're thrilled to have you with us.
        </p>
        <div style="background: linear-gradient(180deg, #18181b 0%, #09090b 100%); padding: 24px; border-radius: 8px; border: 1px solid #27272a; margin-bottom: 32px;">
          <p style="font-size: 14px; color: #e4e4e7; margin: 0;">
            We will remind you shortly when your workspace is ready to be provisioned.
          </p>
        </div>
        <hr style="border-color: #27272a; margin: 40px 0; border-width: 1px 0 0 0; border-style: solid;" />
        <p style="font-size: 12px; color: #52525b;">
          &copy; ${new Date().getFullYear()} Continuum Inc. All rights reserved.
        </p>
      </div>
    `;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Continuum Beta <beta@continuum.dev>', // Note: in a real app, this must be a verified domain
        to: email,
        subject: 'Welcome to the Continuum Private Beta',
        html: emailHtml,
      });
      console.log(`[Waitlist API] Premium email sent to ${email}`);
    } else {
      console.log(`[Waitlist API] Mocking email send to ${email} (RESEND_API_KEY not set)`);
      console.log(`[Waitlist API] Email Subject: Welcome to the Continuum Private Beta`);
    }

    return NextResponse.json({ success: true, waitlistEntry });
  } catch (error) {
    console.error('[Waitlist API Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
