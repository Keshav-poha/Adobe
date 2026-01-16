import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";
import { DocumentSandboxApi } from "../models/DocumentSandboxApi";

const { runtime } = addOnSandboxSdk.instance;

function start(): void {
    const sandboxApi: DocumentSandboxApi = {
        createRectangle: () => {
            const rectangle = editor.createRectangle();
            rectangle.width = 240;
            rectangle.height = 180;
            rectangle.translation = { x: 10, y: 10 };
            const color = { red: 0.32, green: 0.34, blue: 0.89, alpha: 1 };
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;
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
                console.error("Error adding image to document:", error);
            }
        },
    };

    runtime.exposeApi(sandboxApi);
}

start();

