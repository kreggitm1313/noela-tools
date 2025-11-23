import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return new NextResponse(JSON.stringify({ status: "Webhook OK" }), { headers: { "Content-Type": "application/json" }});
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log("Farcaster webhook received:", body);
    return new NextResponse(JSON.stringify({ status: "ok", received: body }), { headers: { "Content-Type": "application/json" }});
  } catch (e: any) {
    console.error("webhook error", e);
    return new NextResponse(JSON.stringify({ status: "error", error: e.message }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}
