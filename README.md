# ESP Yards Lights Automation
This is a small project for **lights automation** using ESP micro-controllers.
It primarily targets **ESP32** and also supports **ESP8266** (unstable with webserver; not recommended for long-term use).

The system allows controllable sensor triggers that enable lights for a configurable off-delay period.
Each trigger can be disabled independently. A main **Zone Control** switch can disable all triggers regardless of their configuration.

**Features:**
- Real-time display of time left until lights turn off
- Auto-disable timer for Zone Control that automatically re-enables it after a set period


## Setup & Build Instructions
This project uses **PlatformIO**.

1. Configure secrets:

    Go to the `include/` directory and copy:

    ```bash
    cp secret.template.h secret.h
    ```

    Then edit `secret.h` to set your configuration.

2. Bundle UI frontend:

    Follow detailed [instructions](./ui/README.md) to bundle frontend files.

3. Build and upload the filesystem image to SPIFFS:

    Use PlatformIO to build and upload files from the `data/` dir to the ESP.

4. Build and upload the main application:

    Use PlatformIO to compile and flash your ESP board.


## Development
For development purposes, Docker and Docker Compose are provided.

This is mainly useful for **UI development/debugging** without running any program on the ESP board itself.
The ESP API is simulated with `Python/FastAPI` and to enable live updates while developing the UI, `LiveServer` is used.
No extra installation is required beyond Docker and Docker Compose.

### Starting the Development Environment
Run the following:

```bash
docker-compose up -d
```

- The **API** is accessible at: `http://localhost:8000`
- The **Live Server** serving `data/` is accessible at: `http://localhost:3000`
- Make sure that `ui/.env` is properly configured to access the dev API.
- Start bundling in watch mode with:

    ```bash
    cd ui/
    npm run dev
    ```
