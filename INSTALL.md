# Installation Guide for Klicki-Bunti Gemini

This guide explains how to set up and run the Klicki-Bunti Gemini application on a new machine (Windows, macOS, or Linux).

## Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js:** Version 18.x or higher. You can download it from [nodejs.org](https://nodejs.org/).
-   **npm:** This is the Node.js package manager and is automatically installed with Node.js.

## Setup Steps

1.  **Obtain the Project Files:**
    Get the complete project folder, either by cloning it from a version control system (like Git) or by copying it directly.

2.  **Create an Environment File:**
    The application requires a Google Gemini API key to function. You need to create a file to store this key.

    -   In the root directory of the project, create a new file. The recommended name is `.env.local`.
    -   Open the file and add the following line, replacing `YOUR_API_KEY_HERE` with your actual Gemini API key:

        ```
        GEMINI_API_KEY=YOUR_API_KEY_HERE
        ```

    **Security Note:** The `.env.local` file contains private keys and should **never** be committed to version control. The `.gitignore` file is already configured to ignore it for this reason.

3.  **Install Dependencies:**
    Open your terminal or command prompt, navigate into the project's root directory, and run the following command to install all the necessary packages:

    ```bash
    npm install
    ```

4.  **Run the Application:**
    After the installation is complete, you can start the local development server with this command:

    ```bash
    npm run dev
    ```

    The terminal will display a local URL, typically `http://localhost:5173` or a similar port. Open this URL in a modern web browser (like Chrome, Edge, or Firefox) that supports the File System Access API.

---

That's it! The application should now be running in your browser.
