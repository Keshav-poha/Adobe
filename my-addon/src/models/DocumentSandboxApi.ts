// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
export interface DocumentSandboxApi {
    createRectangle(options: { x: number; y: number; width: number; height: number; fillColor: string; strokeColor?: string; strokeWidth?: number }): void;
    addImageToDocument(imageBlob: Blob): Promise<void>;
}
