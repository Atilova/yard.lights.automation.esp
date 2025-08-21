UI Bundling Instructions
========================

This folder contains the front-end UI code. Bundling is handled using **esbuild**.

Prerequisites
-------------

- **Node.js** version **>= 22.0.0**
- **npm** version **>= 10.0.0**

Setup
-----

1. Install dependencies from `package-lock.json`:

    ```bash
    npm ci
    ```

    ⚠️ Use `npm ci` instead of `npm install` to ensure the installed packages match exactly what's in the lock file.

2. Create your `.env` file:

    ```bash
    cp .env.example .env
    ```

    Then open `.env` and set all required environment variables or override any default values.

Build
-----

To bundle UI files:

```bash
npm run build
```

This will generate:

- `data/static/app.js`
- `data/static/app.css`

Development Mode
----------------

To automatically rebuild on changes:

```bash
npm run dev
```

This will watch your source files and update the output automatically.
