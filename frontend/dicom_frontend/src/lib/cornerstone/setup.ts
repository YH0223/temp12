'use client'

// Cornerstone + WADO 초기화 유틸리티 (브라우저에서만 동적 로드)
let initPromise: Promise<any> | null = null;

export async function setupCornerstone(): Promise<void> {
    if (initialized) return;
    if (typeof window === "undefined") return;

    const [cornerstoneMod, dicomParserMod, wadoMod] = await Promise.all([
        import("cornerstone-core"),
        import("dicom-parser"),
        import("cornerstone-wado-image-loader"),
    ]);

    const cornerstone: any = (cornerstoneMod as any).default ?? cornerstoneMod;
    const dicomParser: any = (dicomParserMod as any).default ?? dicomParserMod;
    const cornerstoneWADOImageLoader: any =
        (wadoMod as any).default ?? wadoMod;

    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    cornerstoneWADOImageLoader.configure({
        beforeSend: (xhr: XMLHttpRequest) => {
            const token = localStorage.getItem("accessToken");
            if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        },
    });

    initialized = true;
}
let initialized = false;

export async function getCornerstone(): Promise<any> {
    if (initialized) return;
    if (typeof window === "undefined") return; // SSR 가드

    // 동적 임포트
    const [cornerstoneMod, dicomParserMod, wadoMod] = await Promise.all([
        import("cornerstone-core"),
        import("dicom-parser"),
        import("cornerstone-wado-image-loader"),
    ]);


    if (typeof window === 'undefined') {
    // SSR 회피: 클라이언트에서만 로드
    throw new Error('Cornerstone can only be initialized in the browser');
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const csMod = await import('cornerstone-core');
    const cornerstone: any = (csMod as any).default ?? csMod;

    const dpMod = await import('dicom-parser');
    const dicomParser: any = (dpMod as any).default ?? dpMod;

    const loaderMod = await import('cornerstone-wado-image-loader');
    const wadoLoader: any = (loaderMod as any).default ?? loaderMod;

    // 외부 참조 연결
    wadoLoader.external = { cornerstone, dicomParser };
    wadoLoader.configure({
      useWebWorkers: false,
      // 일부 서버가 기본 text/html로 응답하지 않도록 Accept 헤더를 명시
      beforeSend: (xhr: XMLHttpRequest) => {
        try {
          xhr.setRequestHeader(
            'Accept',
            'multipart/related; type="application/octet-stream", application/octet-stream, application/dicom, image/jpeg, image/jp2'
          );
        } catch {}
      },
    });

    // 로더 수동 등록 (wadors/wadouri)
    if (wadoLoader?.wadors?.loadImage) {
      cornerstone.registerImageLoader('wadors', wadoLoader.wadors.loadImage);
      if (wadoLoader?.wadors?.metaData?.provider) {
        cornerstone.metaData?.addProvider?.(wadoLoader.wadors.metaData.provider);
      }
    }
    if (wadoLoader?.wadouri?.loadImage) {
      cornerstone.registerImageLoader('wadouri', wadoLoader.wadouri.loadImage);
    }

    return cornerstone;
  })();

  return initPromise;
}

