'use client';

let initPromise: Promise<any> | null = null;
let csSingleton: any | null = null;

export async function setupCornerstone(): Promise<any> {
    if (csSingleton) return csSingleton;
    if (initPromise) return initPromise;
    if (typeof window === 'undefined') return null;

    initPromise = (async () => {
        const csMod = await import('cornerstone-core');
        const cornerstone: any = (csMod as any).default ?? csMod;

        const dpMod = await import('dicom-parser');
        const dicomParser: any = (dpMod as any).default ?? dpMod;

        const loaderMod = await import('cornerstone-wado-image-loader');
        const wado: any = (loaderMod as any).default ?? loaderMod;

        // 외부 주입 (여기를 통째로 덮지 말고 필드에 할당!)
        wado.external.cornerstone = cornerstone;
        wado.external.dicomParser = dicomParser;

        // 개발/Next 환경 안정화: 웹워커 끄기 + Accept 헤더
        wado.configure({
            useWebWorkers: false,
            beforeSend: (xhr: XMLHttpRequest) => {
                try {
                    xhr.setRequestHeader(
                        'Accept',
                        'multipart/related; type="application/octet-stream", application/octet-stream, application/dicom, image/jpeg, image/jp2'
                    );
                    const token = localStorage.getItem('accessToken');
                    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                } catch {}
            },
        });

        // 이벤트 훅(문제 추적에 도움)
        const events = (cornerstone as any).events ?? (cornerstone as any).eventTarget;
        try {
            events?.addEventListener?.('cornerstoneimageloadfailed', (e: any) => {
                console.error('[cornerstone] image load failed', e?.detail);
            });
            events?.addEventListener?.('cornerstoneimageloadprogress', (e: any) => {
                const { imageId, percentComplete } = e?.detail || {};
                console.log('[cornerstone] progress', percentComplete, imageId);
            });
        } catch {}

        csSingleton = cornerstone;
        return cornerstone;
    })();

    return initPromise;
}

/** setupCornerstone() 이후 동기적으로 꺼내 쓰는 용도 */
export function getCornerstone(): any {
    if (!csSingleton) {
        throw new Error('Cornerstone not initialized. Call await setupCornerstone() first.');
    }
    return csSingleton;
}
