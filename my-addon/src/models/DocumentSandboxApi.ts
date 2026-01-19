// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
export interface DocumentSandboxApi {
    createRectangle(options: { x: number; y: number; width: number; height: number; fillColor: string; strokeColor?: string; strokeWidth?: number }): void;
    addImageToDocument(imageBlob: Blob): Promise<void>;
    createText(text: string): void;
    createStyledText(options: {
        text: string;
        x?: number;
        y?: number;
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        bold?: boolean;
        italic?: boolean;
    }): void;
    createTextBox(options: {
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fontSize?: number;
        color?: string;
        backgroundColor?: string;
    }): void;
}
