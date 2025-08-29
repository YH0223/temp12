/**
 * DICOMweb 프록시 (CORS 회피 및 단일 엔드포인트화)
 * 예: /api/dicomweb/studies/{StudyUID}/series/{SeriesUID}/instances/{SOPUID}/frames/1
 */
import { NextRequest } from 'next/server';

const BACKEND = process.env.BACKEND_API_BASE;
const DICOMWEB_PATH = process.env.DICOMWEB_PATH ?? '/dicomweb';

function buildBackendUrl(req: NextRequest) {
  if (!BACKEND) throw new Error('BACKEND_API_BASE env missing');
  const url = new URL(req.url);
  // /api/dicomweb/... -> ... 부분만 추출
  const forwardPath = url.pathname.replace(/^\/api\/dicomweb/, '');
  const target = `${BACKEND}${DICOMWEB_PATH}${forwardPath}${url.search}`;
  return target;
}

async function forward(req: NextRequest) {
  const target = buildBackendUrl(req);
  const init: RequestInit = {
    method: req.method,
    headers: new Headers(req.headers),
    cache: 'no-store',
    // body는 GET/HEAD에서는 undefined로
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
  };

  const resp = await fetch(target, init);
  const body = await resp.arrayBuffer();

  return new Response(body, {
    status: resp.status,
    headers: {
      'content-type': resp.headers.get('content-type') || 'application/octet-stream',
      'cache-control': 'no-store',
    },
  });
}

export async function GET(req: NextRequest) {
  return forward(req);
}

export async function POST(req: NextRequest) {
  return forward(req);
}

export async function PUT(req: NextRequest) {
  return forward(req);
}

export async function DELETE(req: NextRequest) {
  return forward(req);
}


