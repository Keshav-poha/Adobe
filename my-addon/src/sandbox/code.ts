import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";
import { DocumentSandboxApi } from "../models/DocumentSandboxApi";

const { runtime } = addOnSandboxSdk.instance;

function start(): void {
    const sandboxApi: DocumentSandboxApi = {
        createRectangle: (options: { x: number; y: number; width: number; height: number; fillColor: string; strokeColor?: string; strokeWidth?: number }) => {
            const rectangle = editor.createRectangle();
            rectangle.width = options.width;
            rectangle.height = options.height;
            rectangle.translation = { x: options.x, y: options.y };

            // Convert hex color to RGB
            const hex = options.fillColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            const color = { red: r, green: g, blue: b, alpha: 1 };

            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;

            // Note: Stroke implementation may need adjustment based on Adobe Express SDK
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },
        addImageToDocument: async (imageBlob: Blob) => {
            try {
                const insertionParent = editor.context.insertionParent;
                await editor.loadBitmapImage(imageBlob).then((bitmapImage) => {
                    const mediaContainerNode = editor.createImageContainer(bitmapImage);
                    insertionParent.children.append(mediaContainerNode);
                });
            } catch (error) {
                // Image insertion failed
            }
        },
        createText: (text: string) => {
            try {
                const insertionParent = editor.context.insertionParent;
                const textNode = editor.createText(text);

                // Position the text at a random-ish location so multiple inserts don't overlap exactly
                const baseX = Math.floor(Math.random() * 300) + 40;
                const baseY = Math.floor(Math.random() * 300) + 40;
                textNode.setPositionInParent({ x: baseX, y: baseY }, { x: 0, y: 0 });

                // Apply a reasonable default style
                textNode.fullContent.applyCharacterStyles({ fontSize: 20, color: { red: 0, green: 0, blue: 0, alpha: 1 } });

                insertionParent.children.append(textNode);
            } catch (e) {
                // ignore insertion errors
            }
        },
    };

    runtime.exposeApi(sandboxApi);
}

start();

