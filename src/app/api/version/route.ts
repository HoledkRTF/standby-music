import { NextResponse } from 'next/server';
import { APP_VERSION, APP_CODENAME } from '@/data/version';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      version: APP_VERSION,
      codename: APP_CODENAME,
      timestamp: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
