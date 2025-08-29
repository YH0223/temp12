'use client';

// Cornerstone + WADO 초기화 유틸리티 (브라우저에서만 동적 로드)
let initPromise: Promise<any> | null = null;
let initialized = false;

let _cs: any | null = null;
let _ready: Promise<void> | null = null;

export async function setupCornerstone() {
    if (_ready) return _ready;
    _ready = (async () => {
        const csMod = await import('cornerstone-core');
        const cs: any = (csMod as any).default ?? csMod;
        const dpMod = await import('dicom-parser');
        const dicomParser: any = (dpMod as any).default ?? dpMod;

        const wadoMod = await import('cornerstone-wado-image-loader');
        const wado: any = (wadoMod as any).default ?? wadoMod;

        // 외부 주입
        wado.external.cornerstone = cs;
        wado.external.dicomParser = dicomParser;

        // (권장) Web Worker & Codecs 설정
        // /public/cornerstone/ 아래에 파일을 배치하세요.
        // - codecs.js, codecs.wasm(있으면), webWorker.js
        wado.webWorkerManager.initialize({
            maxWebWorkers: navigator.hardwareConcurrency ? Math.min(4, navigator.hardwareConcurrency) : 2,
            startWebWorkersOnDemand: true,
            taskConfiguration: {
                decodeTask: {
                    initializeCodecsOnStartup: false,
                    usePDFJS: false,
                    strict: false,
                },
            },
            webWorkerPath: '/cornerstone/webWorker.js',
            // 최신 패키지에서는 codecsPath 하나로 충분한 경우도 있음
            codecsPath: '/cornerstone/codecs.js',
        });

        // 인증 헤더(필요 시)
        wado.configure({
            beforeSend: (xhr: XMLHttpRequest) => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            },
            useWebWorkers: true,
        });

        // 로드 풀(과도 동시요청 방지)
        cs.imageLoadPoolManager.maxNumRequests = 6;

        _cs = cs;
    })();
    return _ready;
}
export async function getCornerstone(): Promise<any> {
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

