'use client';

import React, { useEffect, useRef } from 'react';
import { setupCornerstone, getCornerstone } from '@/lib/cornerstone/setup';

interface Props {
    imageIds: string[];
}

export const CornerstoneViewport: React.FC<Props> = ({ imageIds }) => {
    const elementRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        setupCornerstone();
    }, []);

    useEffect(() => {
        let mounted = true;
        let cs: any | null = null;
        const el = elementRef.current;

        if (!el || imageIds.length === 0) return;

        (async () => {
            try {
                // 1) Cornerstone/WADO 초기화 보장
                await setupCornerstone();
                cs = getCornerstone();

                if (!mounted || !cs || typeof cs.enable !== 'function') return;

                // 2) 엘리먼트 활성화
                cs.enable(el);

                // 3) 이미지 로딩 (loadAndCacheImage 권장)
                const image = await cs.loadAndCacheImage(imageIds[0]);
                if (!mounted) return;

                // 4) 뷰포트 기본값 적용 + 디스플레이
                const viewport = cs.getDefaultViewportForImage(el, image);
                cs.displayImage(el, image, viewport);

            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Cornerstone loadImage error:', e);
            }
        })();

        // 5) 클린업
        return () => {
            mounted = false;
            try {
                if (cs && typeof cs.disable === 'function' && el) cs.disable(el);
            } catch { /* no-op */ }
        };
    }, [imageIds]);

    return (
        <div
            ref={elementRef}
            className="w-[512px] h-[512px] bg-black"
        />
    );
};