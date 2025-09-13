import { ChatMessage, ChatSession, MessageAuthor } from '../types';

/**
 * Export chat messages to Markdown format
 */
export function exportChatToMarkdown(messages: ChatMessage[], sessionName?: string): string {
  const timestamp = new Date().toLocaleString();
  
  let markdown = `# Chat Export - ${sessionName || 'Klicki-Bunti-Gemini'}\n\n`;
  markdown += `*Exported on ${timestamp}*\n\n`;
  markdown += `---\n\n`;

  messages.forEach((message) => {
    const authorEmoji = message.author === MessageAuthor.USER ? '👤' : 
                       message.author === MessageAuthor.AI ? '🤖' : '📢';
    const authorName = message.author === MessageAuthor.USER ? 'User' :
                      message.author === MessageAuthor.AI ? 'AI Assistant' : 'System';
    
    const messageTime = new Date(message.timestamp).toLocaleTimeString();
    
    markdown += `## ${authorEmoji} ${authorName} - ${messageTime}\n\n`;
    
    if (message.isFavorite) {
      markdown += `⭐ *Favorited*\n\n`;
    }
    
    if (message.isEdited) {
      markdown += `✏️ *Edited*\n\n`;
    }
    
    // Add message content
    markdown += `${message.content}\n\n`;
    
    // Add file change information if present
    if (message.fileChange) {
      markdown += `### 📁 File Operation\n\n`;
      markdown += `- **Action**: ${message.fileChange.type === 'create' ? 'Create' : 'Update'}\n`;
      markdown += `- **File**: \`${message.fileChange.filePath}\`\n\n`;
      markdown += `**Content:**\n\n`;
      markdown += `\`\`\`
${message.fileChange.newContent}
\`\`\`

`;
    }
    
    markdown += `---\n\n`;
  });

  return markdown;
}

/**
 * Export complete chat session to Markdown
 */
export function exportSessionToMarkdown(session: ChatSession): string {
  let markdown = `# Chat Session: ${session.name}\n\n`;
  markdown += `**Created**: ${new Date(session.createdAt).toLocaleString()}\n`;
  markdown += `**Last Updated**: ${new Date(session.lastUpdated).toLocaleString()}\n`;
  
  if (session.projectPath) {
    markdown += `**Project**: ${session.projectPath}\n`;
  }
  
  markdown += `**Messages**: ${session.messages.length}\n\n`;
  markdown += `---\n\n`;
  
  // Add messages
  markdown += exportChatToMarkdown(session.messages);
  
  return markdown;
}

/**
 * Download text content as a file
 */
export function downloadAsFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Generate a filename with timestamp
 */
export function generateExportFilename(sessionName?: string, extension: string = 'md'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const safeName = (sessionName || 'chat-session').replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${safeName}-${timestamp}.${extension}`;
}