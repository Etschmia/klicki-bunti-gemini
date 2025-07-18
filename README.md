# Klicki-Bunti Gemini

Klicki-Bunti Gemini is a graphical user interface for Google Gemini that brings AI-powered code assistance to your local projects. Unlike the web version of Gemini, this app allows you to select a local directory, giving the AI contextual access to your project's file structure and content—without uploading your files to any server. The app runs entirely in your browser using the modern File System Access API.

## Features

- Select a local project directory as context for the AI assistant
- Browse your project's file tree and select files for detailed context
- Ask programming questions and get AI-powered answers with code examples
- All file access stays local—your code never leaves your machine

---

## Installation & Usage

### Prerequisites

- **Node.js** (version 18.x or higher)
- **npm** (comes with Node.js)

### Setup Steps

1. **Clone or Download the Project**

   Get the complete project folder by cloning from GitHub or copying it directly.

2. **Create an Environment File**

   The app requires a Google Gemini API key.

   - In the project root, create a file named `.env.local`.
   - Add the following line, replacing `YOUR_API_KEY_HERE` with your Gemini API key:

     ```
     GEMINI_API_KEY=YOUR_API_KEY_HERE
     ```

   **Security Note:**  
   Do **not** commit `.env.local` to version control. It is already listed in `.gitignore`.

3. **Install Dependencies**

   Open a terminal in the project root and run:

   ```bash
   npm install
   ```

4. **Run the Application**

   Start the local development server:

   ```bash
   npm run dev
   ```

   Open the displayed local URL (e.g., `http://localhost:5173`) in a modern browser (Chrome, Edge, or Firefox) that supports the File System Access API.

---

## Project Structure

- `components/` – React UI components
- `hooks/` – Custom React hooks
- `services/` – Gemini API integration
- `types.ts` – Shared TypeScript types

---

## Security & Privacy

- Your files remain on your computer at all times.
- Only files you explicitly select are read and used as context for the AI.

---

## License

This project is for personal and educational use. See [LICENSE](LICENSE) if