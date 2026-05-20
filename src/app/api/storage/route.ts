import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { getUploadUrl, getDownloadUrl, deleteObject } from '@/lib/r2';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await verifyJwt(token);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, key, contentType } = await req.json();

    if (action === 'getUploadUrl') {
      if (!key || !contentType) {
        return NextResponse.json({ error: 'Missing key or contentType' }, { status: 400 });
      }
      const url = await getUploadUrl(key, contentType);
      return NextResponse.json({ url });
    }

    if (action === 'getDownloadUrl') {
      if (!key) {
        return NextResponse.json({ error: 'Missing key' }, { status: 400 });
      }
      const url = await getDownloadUrl(key);
      return NextResponse.json({ url });
    }

    if (action === 'deleteFile') {
      if (!key) {
        return NextResponse.json({ error: 'Missing key' }, { status: 400 });
      }
      await deleteObject(key);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Storage API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
