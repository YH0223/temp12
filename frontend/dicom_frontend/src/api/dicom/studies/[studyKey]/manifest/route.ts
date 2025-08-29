/**
 * DICOM Study Manifest API (Next.js App Router)
 * GET /api/dicom/studies/:studyKey/manifest
 * - mock 제거
 * - 백엔드로 프록시만 수행
 * - Authorization/Cookie 패스스루
 * - 상태/헤더 원형 유지
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_API_BASE="http://localhost:8080";

export async function GET(
    req: NextRequest,
    { params }: { params: { studyKey: string } }
) {
    const { studyKey } = params || ({} as any);

    if (!BACKEND_API_BASE) {
        return NextResponse.json(
            {
                success: false,
                error: "CONFIG_ERROR",
                message: "환경변수 BACKEND_API_BASE가 설정되어 있지 않습니다.",
            },
            { status: 500 }
        );
    }

    if (!studyKey || typeof studyKey !== "string") {
        return NextResponse.json(
            {
                success: false,
                error: "INVALID_STUDY_KEY",
                message: "유효한 studyKey가 필요합니다.",
            },
            { status: 400 }
        );
    }

    // 백엔드 URL 구성 (쿼리스트링도 전달)
    const base = BACKEND_API_BASE.replace(/\/+$/, "");
    const url = new URL(
        `${base}/api/dicom/studies/${encodeURIComponent(studyKey)}/manifest`
    );
    if (req.nextUrl.search) url.search = req.nextUrl.search;

    // 인증/쿠키 헤더 패스스루
    const headers: Record<string, string> = {
        Accept: "application/json",
    };
    const auth = req.headers.get("authorization");
    if (auth) headers["Authorization"] = auth;
    const cookie = req.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    // (선택) 포워드 관련 헤더
    const xfwdFor = req.headers.get("x-forwarded-for");
    if (xfwdFor) headers["x-forwarded-for"] = xfwdFor;
    const host = req.headers.get("host");
    if (host) headers["x-forwarded-host"] = host;
    headers["x-forwarded-proto"] = req.nextUrl.protocol.replace(":", "");

    // 백엔드 호출 (캐시 금지)
    const backendResp = await fetch(url.toString(), {
        method: "GET",
        headers,
        cache: "no-store",
    });

    // 바디/헤더/상태 그대로 전달
    const body = await backendResp.arrayBuffer();
    const out = new NextResponse(body, { status: backendResp.status });

    // 원본 헤더 전달(불필요/문제되는 헤더는 제외)
    backendResp.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (k === "content-length") return; // 자동 계산
        out.headers.set(key, value);
    });

    // 개발 편의를 위한 캐시 방지
    out.headers.set("Cache-Control", "no-store");

    return out;
}

// (옵션) 프리플라이트 처리 필요 시
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
        },
    });
}
