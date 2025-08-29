/**
 * Backend의 DICOM 파일 URL을 프록시하여 wadouri로 접근 가능하게 함
 * 사용 예: wadouri:/api/dicom/file-proxy?path=%2Fapi%2Fdicom%2Finstances%2F{uid}%2Ffile
 */
import { NextRequest } from 'next/server';

const BACKEND = process.env.BACKEND_API_BASE;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raw = url.searchParams.get('path');
  if (!raw) return new Response('Missing path', { status: 400 });

  // 절대 URL인지 상대 경로인지 판별
  let target = raw;
  const isAbsolute = /^https?:\/\//i.test(raw);
  if (!isAbsolute) {
    if (!BACKEND) return new Response('BACKEND_API_BASE not set', { status: 500 });
    // ensure single slash join
    target = `${BACKEND}${raw.startsWith('/') ? '' : '/'}${raw}`;
  }

  const resp = await fetch(target, { cache: 'no-store' });
  const body = await resp.arrayBuffer();
  return new Response(body, {
    status: resp.status,
    headers: {
      'content-type': resp.headers.get('content-type') || 'application/dicom',
      'cache-control': 'no-store',
    },
  });
}


