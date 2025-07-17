# Exporting the Project

To package this project for transfer to another machine, you need to create a production-ready build. This process compiles and optimizes all the necessary files into a static format that can be easily served.

## Steps

1.  **Build the Project:**
    Open your terminal in the project's root directory and run the following command:
    ```bash
    npm run build
    ```
    This command will create a new directory named `dist` in your project root. This `dist` folder contains the optimized, static HTML, CSS, and JavaScript files for the application.

2.  **Transfer the Project:**
    You can now transfer the entire project folder to another machine. While the whole folder is useful for further development, the most critical part for deployment is the `dist` directory.

    **Important:** The Gemini API key is loaded from a `.env` file at runtime. This file is *not* included in the build and should **never** be shared publicly. The person setting up the project on the new machine will need to create their own `.env` file with their own API key.

---

**Summary for Transfer:**

- Run `npm run build`.
- Copy the project folder.
- Ensure the recipient knows they need to create their own `.env` file with a valid Gemini API key.
