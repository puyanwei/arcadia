import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasBackendUrl: !!process.env.NEXT_PUBLIC_BACKEND_URL
    }
  });
} 