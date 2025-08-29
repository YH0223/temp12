// src/hooks/usePrefetchCornerstone.ts
import { useEffect } from "react";


export function usePrefetchCornerstone(imageIds: string[], currentIndex: number) {
    useEffect(() => {
        if (typeof window === "undefined") return;      // ✅ SSR 가드
        if (!Array.isArray(imageIds) || imageIds.length === 0) return;

        let cancelled = false;

        (async () => {
            // 동적 임포트 (클라이언트에서만 로드)
            const csMod = await import("cornerstone-core");
            const cornerstone: any = (csMod as any).default ?? csMod;

            // 현재 ±2 인덱스 대상 수집
            const targets = [0, -1, 1, -2, 2]
                .map((o) => currentIndex + o)
                .filter((i) => i >= 0 && i < imageIds.length);

            const concurrency = 4;
            let active = 0;
            const queue = [...targets];

            const tick = async () => {
                if (cancelled) return;
                while (active < concurrency && queue.length > 0) {
                    const idx = queue.shift()!;
                    const id = imageIds[idx];
                    active++;
                    try {
                        await cornerstone.loadAndCacheImage(id);
                    } catch {
                        /* no-op */
                    } finally {
                        active--;
                        if (!cancelled) tick();
                    }
                }
            };

            tick();
        })();

        return () => {
            cancelled = true;
        };
    }, [imageIds, currentIndex]);
}