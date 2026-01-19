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
        createStyledText: (options: {
            text: string;
            x?: number;
            y?: number;
            fontSize?: number;
            fontFamily?: string;
            color?: string;
            bold?: boolean;
            italic?: boolean;
        }) => {
            try {
                const insertionParent = editor.context.insertionParent;
                const textNode = editor.createText(options.text);

                // Position the text
                const x = options.x ?? Math.floor(Math.random() * 300) + 40;
                const y = options.y ?? Math.floor(Math.random() * 300) + 40;
                textNode.setPositionInParent({ x, y }, { x: 0, y: 0 });

                // Convert hex color to RGB
                let textColor = { red: 0, green: 0, blue: 0, alpha: 1 };
                if (options.color) {
                    const hex = options.color.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16) / 255;
                    const g = parseInt(hex.substr(2, 2), 16) / 255;
                    const b = parseInt(hex.substr(4, 2), 16) / 255;
                    textColor = { red: r, green: g, blue: b, alpha: 1 };
                }

                // Apply character styles
                const charStyles: any = {
                    fontSize: options.fontSize ?? 20,
                    color: textColor
                };

                if (options.fontFamily) {
                    charStyles.fontFamily = options.fontFamily;
                }

                if (options.bold) {
                    charStyles.fontWeight = 'bold';
                }

                if (options.italic) {
                    charStyles.fontStyle = 'italic';
                }

                textNode.fullContent.applyCharacterStyles(charStyles);

                insertionParent.children.append(textNode);
            } catch (e) {
                // ignore insertion errors
            }
        },
        createTextBox: (options: {
            text: string;
            x: number;
            y: number;
            width: number;
            height: number;
            fontSize?: number;
            color?: string;
            backgroundColor?: string;
        }) => {
            try {
                const insertionParent = editor.context.insertionParent;

                // Create a rectangle for the background
                const backgroundRect = editor.createRectangle();
                backgroundRect.width = options.width;
                backgroundRect.height = options.height;
                backgroundRect.translation = { x: options.x, y: options.y };

                // Set background color if provided
                if (options.backgroundColor) {
                    const hex = options.backgroundColor.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16) / 255;
                    const g = parseInt(hex.substr(2, 2), 16) / 255;
                    const b = parseInt(hex.substr(4, 2), 16) / 255;
                    const bgColor = { red: r, green: g, blue: b, alpha: 1 };
                    const rectFill = editor.makeColorFill(bgColor);
                    backgroundRect.fill = rectFill;
                }

                // Create the text node
                const textNode = editor.createText(options.text);
                textNode.setPositionInParent({ x: options.x + 20, y: options.y + 20 }, { x: 0, y: 0 });

                // Convert text color to RGB
                let textColor = { red: 0, green: 0, blue: 0, alpha: 1 };
                if (options.color) {
                    const hex = options.color.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16) / 255;
                    const g = parseInt(hex.substr(2, 2), 16) / 255;
                    const b = parseInt(hex.substr(4, 2), 16) / 255;
                    textColor = { red: r, green: g, blue: b, alpha: 1 };
                }

                // Apply text styling
                textNode.fullContent.applyCharacterStyles({
                    fontSize: options.fontSize ?? 16,
                    color: textColor
                });

                // Group the background and text together
                const textBoxGroup = editor.createGroup();
                textBoxGroup.children.append(backgroundRect);
                textBoxGroup.children.append(textNode);

                insertionParent.children.append(textBoxGroup);
            } catch (e) {
                // ignore insertion errors
            }
        },
    };

    runtime.exposeApi(sandboxApi);
}

start();

