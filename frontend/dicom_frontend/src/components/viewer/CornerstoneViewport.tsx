// CornerstoneViewport.tsx
'use client'
import React, { useEffect, useRef } from 'react';
import { setupCornerstone, getCornerstone } from '@/lib/cornerstone/setup';

interface Props {
    imageIds: string[];
    zoom?: number;        // 1.0 = 100%
    invert?: boolean;     // 흑/백 반전
}

export const CornerstoneViewport: React.FC<Props> = ({ imageIds, zoom = 1, invert = false }) => {
    const elementRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let mounted = true;
        let cs: any;
        const el = elementRef.current;
        if (!el || imageIds.length === 0) return;

        // 컨테이너가 실제로 넓이/높이가 있어야 함 (상위가 flex-1 등으로 채워주도록)
        el.style.width = '100%';
        el.style.height = '100%';

        (async () => {
            await setupCornerstone();
            cs = getCornerstone();
            if (!mounted) return;

            // 중복 enable 방어
            try { cs.disable(el); } catch {}
            cs.enable(el);

            const image = await cs.loadAndCacheImage(imageIds[0]);
            if (!mounted) return;

            // 기본 뷰포트
            let vp = cs.getDefaultViewportForImage(el, image);

            // 선명도: CSS 스케일 대신 viewport.scale 사용
            // MONOCHROME1/2는 getDefaultViewportForImage가 적절히 설정하지만,
            // 외부에서 invert prop 주면 덮어씀
            vp.invert = invert ?? vp.invert;

            cs.displayImage(el, image, vp);

            // 컨테이너 크기에 맞춤 + HiDPI 대응
            cs.fitToWindow?.(el);
            cs.resize(el, true); // true면 fit 유사 동작(라이브러리 버전에 따라 무시될 수 있음)

            // 초깃값 zoom 적용 (1.0이면 변화 없음)
            if (zoom !== 1) {
                const cur = cs.getViewport(el);
                cur.scale = (cur.scale ?? 1) * zoom;
                cs.setViewport(el, cur);
            }

            // 리사이즈 반응형
            const ro = new ResizeObserver(() => {
                try {
                    cs.resize(el, true);
                } catch {}
            });
            ro.observe(el);
            (el as any).__ro = ro;
        })();

        return () => {
            mounted = false;
            try {
                (elementRef.current as any)?.__ro?.disconnect?.();
                cs?.disable?.(elementRef.current!);
            } catch {}
        };
    }, [imageIds.join('|')]);

    // zoom / invert 변경 시 뷰포트만 갱신
    useEffect(() => {
        const el = elementRef.current;
        if (!el) return;
        try {
            const cs = getCornerstone();
            const vp = cs.getViewport(el);
            if (!vp) return;
            if (typeof zoom === 'number') {
                // 현재 스케일 기준으로 맞추고 싶으면 *=, 절대값으로 두고 싶으면 = 로
                vp.scale = zoom; // 절대 스케일
            }
            if (typeof invert === 'boolean') {
                vp.invert = invert;
            }
            cs.setViewport(el, vp);
        } catch {}
    }, [zoom, invert]);

    return <div ref={elementRef} className="w-full h-full bg-black" />;
};
