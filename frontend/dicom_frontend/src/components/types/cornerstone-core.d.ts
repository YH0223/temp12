// Cornerstone Core 타입 정의
declare module "cornerstone-core" {
    export interface Image {
        imageId: string;
        width: number;
        height: number;
        rows: number;
        columns: number;
        intercept: number;
        slope: number;
        windowCenter: number;
        windowWidth: number;
        render: (enabledElement: EnabledElement, invalidated: boolean) => void;
        getPixelData: () => Uint16Array | Int16Array | Uint8Array;
    }

    export interface EnabledElement {
        element: HTMLElement;
        image?: Image;
        viewport: Viewport;
        canvas: HTMLCanvasElement;
        invalid: boolean;
        needsRedraw: boolean;
    }

    export interface Viewport {
        scale: number;
        translation: { x: number; y: number };
        voi: {
            windowWidth: number;
            windowCenter: number;
        };
        invert: boolean;
        pixelReplication: boolean;
        rotation: number;
        hflip: boolean;
        vflip: boolean;
        modalityLUT?: any;
        voiLUT?: any;
    }

    export function enable(element: HTMLElement): void;
    export function disable(element: HTMLElement): void;
    export function displayImage(element: HTMLElement, image: Image, viewport?: Partial<Viewport>): void;
    export function loadImage(imageId: string): Promise<Image>;
    export function loadAndCacheImage(imageId: string): Promise<Image>;
    export function registerImageLoader(scheme: string, imageLoader: Function): void;
    export function getViewport(element: HTMLElement): Viewport;
    export function setViewport(element: HTMLElement, viewport: Partial<Viewport>): void;
    export function resize(element: HTMLElement, forcedResize?: boolean): void;
    export function reset(element: HTMLElement): void;
    export function invalidate(element: HTMLElement): void;
    export function draw(element: HTMLElement): void;
    export function getImage(element: HTMLElement): Image | undefined;
    export function getEnabledElement(element: HTMLElement): EnabledElement;
}

declare module "cornerstone-tools" {
    export function init(): void;
    export function addTool(tool: any): void;
    export function setToolActive(toolName: string, options?: any): void;
    export function setToolPassive(toolName: string): void;
    export function setToolEnabled(toolName: string): void;
    export function setToolDisabled(toolName: string): void;
    
    export const ZoomTool: any;
    export const PanTool: any;
    export const WindowLevelTool: any;
    export const RotateTool: any;
    export const LengthTool: any;
    export const RectangleRoiTool: any;
    export const CircleRoiTool: any;
    export const AngleTool: any;
}

declare module "cornerstone-wado-image-loader" {
    export const external: {
        cornerstone: any;
        dicomParser: any;
    };
    
    export const wadouri: {
        loadImage: (imageId: string) => Promise<any>;
    };
    
    export const wadors: {
        loadImage: (imageId: string) => Promise<any>;
    };
}

declare module "dicom-parser" {
    export function parseDicom(byteArray: Uint8Array): any;
}