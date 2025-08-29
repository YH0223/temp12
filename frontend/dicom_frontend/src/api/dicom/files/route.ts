/**
 * 파일서버의 .dcm 파일을 스트리밍하는 간단 프록시 (wadouri 용)
 * GET /api/dicom/files?path=ENCODED_PATH
 */
import { NextRequest } from 'next/server';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { Readable } from 'stream';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encoded = searchParams.get('path');
  if (!encoded) {
    return new Response('Missing path', { status: 400 });
  }

  // 보안상: 실제 운영에서는 허용 루트를 화이트리스트로 제한해야 함
  const filePath = decodeURIComponent(encoded);

  try {
    const s = await stat(filePath);
    if (!s.isFile()) {
      return new Response('Not a file', { status: 400 });
    }

    const stream = createReadStream(filePath);
    const body = Readable.toWeb(stream) as unknown as ReadableStream;
    return new Response(body, {
      headers: {
        'Content-Type': 'application/dicom',
        'Content-Length': String(s.size),
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return new Response('Not found', { status: 404 });
  }
}


