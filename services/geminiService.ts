
import { GoogleGenAI } from "@google/genai";
import { DirectoryItem, FileSystemItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

const stringifyFileTree = (item: FileSystemItem, indent = 0): string => {
    const prefix = '  '.repeat(indent);
    if (item.kind === 'directory') {
        const childrenString = item.children.map(child => stringifyFileTree(child, indent + 1)).join('\n');
        return `${prefix}- ${item.name}/\n${childrenString}`;
    }
    return `${prefix}- ${item.name}`;
};


export const generateResponseStream = async (
    prompt: string,
    fileTree: DirectoryItem | null,
    activeFile: { name: string; content: string } | null
) => {
    let systemInstruction = `You are an expert AI pair programmer.
The user has provided you with the following directory structure of their project.`;

    if (fileTree) {
        systemInstruction += `\n\nDIRECTORY STRUCTURE:\n${stringifyFileTree(fileTree)}`;
    }

    if (activeFile) {
        systemInstruction += `\n\nThey have currently opened the file "${activeFile.name}". Here is its content:\n\n--BEGIN ${activeFile.name}--\n${activeFile.content}\n--END ${activeFile.name}--`;
    }
    
    systemInstruction += `\n\nBased on this context, please answer the user's question. Be concise and provide code examples where appropriate. The user is German, so please try to answer in German unless the context is purely technical.`;

    try {
        const response = await ai.models.generateContentStream({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        // The response from generateContentStream is an AsyncGenerator of GenerateContentResponse objects.
        // We need to adapt it to a stream of text chunks.
        async function* textStream() {
            for await (const chunk of response) {
                yield chunk.text;
            }
        }
        
        return textStream();

    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to get response from Gemini API.");
    }
};
