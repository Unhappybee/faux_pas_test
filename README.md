# FauxPas - Social Cognition Assessment Platform

FauxPas is a web-based application designed to administer and evaluate the "Faux Pas Recognition Test." It allows users to register, take questionnaires based on social scenarios (stories), and receive scores evaluating their understanding of social cues, faux pas, intentions, beliefs, and emotions. The evaluation includes both rule-based scoring and an ML-based component for open-ended questions.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Git LFS](#2-git-lfs)
  - [3. Environment Variables (.env file)](#3-environment-variables-env-file)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [Database Operations](#database-operations)
  - [Migrations](#migrations)
  - [Seeding](#seeding)
  - [Prisma Studio](#prisma-studio)
- [ML Model](#ml-model)
- [CI/CD - Docker Image Publishing](#cicd---docker-image-publishing)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Notes & Potential Improvements](#notes--potential-improvements)


## Tech Stack

*   **Frontend:**
    *   React 19 with Vite
    *   TypeScript
    *   Tailwind CSS (via `@tailwindcss/postcss`)
    *   Axios for API communication
    *   React Router for navigation
    *   Headless UI for UI components
    *   React Hook Form & Zod for form management and validation
    *   Nginx (for serving in production)
*   **Backend:**
    *   Node.js with Express.js
    *   TypeScript
    *   Prisma ORM
    *   PostgreSQL Database
*   **ML API:**
    *   Python 3.12 with FastAPI
    *   PyTorch (CPU version)
    *   Hugging Face Transformers
    *   Uvicorn ASGI server
*   **Database:**
    *   PostgreSQL 15
*   **Containerization & CI/CD:**
    *   Docker & Docker Compose
    *   GitHub Actions
*   **Model Storage:**
    *   Git LFS (for `.safetensors` and `.bin` model files)

## Project Structure

```
Faux/
├── .gitattributes           # Git LFS configuration
├── .gitignore               # Specifies intentionally untracked files
├── .github/
│   └── workflows/
│       └── docker-publish.yml # GitHub Action for Docker image publishing
├── backend/                 # Node.js/Express backend
│   ├── Dockerfile           # Production Dockerfile
│   ├── Dockerfile.dev       # Development Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── evaluation.ts    # Evaluation of individual user answer
│   │   ├── final_score.ts   # Evaluation of the entire user test
│   │   ├── server.ts
│   │   └── scripts/         # Seeding scripts (faux_pas.ts, faux_pas_short.ts)
│   └── dist/                # Compiled JavaScript (output of tsc)
├── frontend/                # React/Vite frontend
│   ├── Dockerfile           # Production Dockerfile (Nginx)
│   ├── Dockerfile.dev       # Development Dockerfile (Vite dev server)
│   ├── nginx.conf           # Nginx configuration for production
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── components/      #
│       ├── types/
│       └── utils/
├── ml_api/                  # Python/FastAPI ML service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   └── model_api.py
│   └── final_trained_model_with_validation/ # ML model files (Git LFS)
├── docker-compose.yml       # Docker Compose for development
├── docker-compose.prod.yml  # Docker Compose for production (uses .env variables)
└── README.md                # This file
```

## Prerequisites

*   Git
*   Git LFS (Large File Storage): [https://git-lfs.github.com/](https://git-lfs.github.com/)
*   Docker: [https://www.docker.com/get-started](https://www.docker.com/get-started)
*   Docker Compose (usually included with Docker Desktop)

## Setup

### 1. Clone Repository

```bash
git clone <your_repository_url> # Replace <your_repository_url> with the actual URL
cd Faux
```

### 2. Git LFS

This project uses Git LFS to manage large model files.
*   **Install Git LFS:** Follow instructions at [https://git-lfs.github.com/](https://git-lfs.github.com/).
*   **Initialize LFS (if you haven't already in this repo):**
    ```bash
    git lfs install
    ```
*   **Pull LFS files:**
    ```bash
    git lfs pull
    ```
    This will download the actual model files stored in `ml_api/final_trained_model_with_validation/`.

### 3. Environment Variables (.env file)

Create a `.env` file in the root directory (`Faux/.env`). This file is crucial for configuring both development and production environments.

**Example `Faux/.env`:**
```env
# --- General ---
NODE_ENV=production                     # Set to 'development' for dev compose if needed
RESTART_POLICY=unless-stopped           # Default restart policy for services

# --- Actual Docker Resource Names (for docker-compose.prod.yml) ---
# These names will be used for the actual network and volume created by Docker on your host.
# The docker-compose.prod.yml file uses static keys (e.g., 'prod_network', 'prod_db_volume')
# for its definitions, and those definitions use these .env variables via the 'name:' attribute
# to set the actual Docker resource names.
NETWORK_NAME=fauxpas_prod_actual_net    # Example: Actual Docker network name
DB_VOLUME_NAME=fauxpas_prod_actual_data # Example: Actual Docker volume name

# --- Image and Container Names / Ports (for docker-compose.prod.yml) ---
# Replace 'your_gh_username/your_repo_name' with your actual GHCR path components.
# The GitHub Actions workflow builds images like: ghcr.io/unhappybee/faux_pas_test/fauxpas-SERVICE:tag
BACKEND_IMAGE_NAME=ghcr.io/unhappybee/faux_pas_test/fauxpas-backend:latest
BACKEND_CONTAINER_NAME=fauxpas_backend_prod_container
BACKEND_HOST_PORT=8080

ML_API_IMAGE_NAME=ghcr.io/unhappybee/faux_pas_test/fauxpas-ml-api:latest
ML_API_CONTAINER_NAME=fauxpas_ml_api_prod_container
ML_API_SERVICE_NAME=ml_api              # Service name for inter-container communication (referenced in ML_API_URL)
ML_API_INTERNAL_PORT=8000               # Internal port the ML API listens on (referenced in ML_API_URL)

FRONTEND_IMAGE_NAME=ghcr.io/unhappybee/faux_pas_test/fauxpas-frontend:latest
FRONTEND_CONTAINER_NAME=fauxpas_frontend_prod_container
FRONTEND_HOST_PORT=80

DB_IMAGE_NAME=postgres:15-alpine
DB_CONTAINER_NAME=fauxpas_db_prod_container
DB_HOST_PORT=5432                       # Host port for DB access (e.g., for Prisma Studio)

# --- Database Credentials (Required for both dev and prod) ---
POSTGRES_USER=your_db_admin_user         
POSTGRES_PASSWORD=your_strong_db_password  
POSTGRES_DB=fauxpas_application_db       

# --- Full Database Connection URL (Required by Prisma for backend) ---
#  'db' is the service name for PostgreSQL in Docker Compose.
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public"

# --- Frontend Development (Used by docker-compose.yml for dev) ---
VITE_API_URL=http://localhost:8080
```

## Running the Application

### Development Mode

Uses local Docker builds with volume mounts for hot-reloading. Configured in `docker-compose.yml`.

1.  **Build and start containers:**
    ```bash
    docker-compose up --build -d
    ```
    (Omit `-d` to see logs in the foreground).

2.  **Access services:**
    *   **Frontend (Vite Dev Server):** `http://localhost:5173`
    *   **Backend API:** `http://localhost:8080`
    *   **ML API:** `http://localhost:8000` (Health check: `http://localhost:8000/health`)
    *   **Database (PostgreSQL):** Accessible on `localhost:5432` from your host (uses the credentials from `.env`).

3.  **Database Operations:** See [Database Operations](#database-operations) (e.g., for seeding). Use `fauxpas_backend_dev` as the service name.

4.  **Stop containers:**
    ```bash
    docker-compose down
    ```
    To remove volumes (e.g., to reset the database): `docker-compose down -v`

### Production Mode

Uses pre-built Docker images and optimized configurations. Configured in `docker-compose.prod.yml` which relies on variables from your `.env` file.

1.  **Ensure `.env` is configured:** All variables listed in the example `.env` for production must be set.
2.  **Ensure images are available:** The GitHub Action should build and push images to GHCR. The `*_IMAGE_NAME` variables in `.env` must point to these images.

3.  **Start containers:**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d
    ```
    If you've made changes to production Dockerfiles and are not relying on pre-built GHCR images (or want to force a rebuild with local changes), add `--build`:
    `docker-compose -f docker-compose.prod.yml up --build -d`

4.  **Access services:**
    *   **Frontend (Nginx):** `http://localhost:${FRONTEND_HOST_PORT}` (e.g., `http://localhost:80`)
    *   **Backend API:** Accessible via `http://localhost:${BACKEND_HOST_PORT}` (e.g., `http://localhost:8080`).
    *   **ML API:** Not directly exposed externally. The backend communicates with it internally.
    *   **Database (PostgreSQL):** Accessible on `localhost:${DB_HOST_PORT}` (e.g., `localhost:5432`).

5.  **Database Operations:** See [Database Operations](#database-operations). Use the container name specified by `${BACKEND_CONTAINER_NAME}` in your `.env` file for exec commands:
    ```bash
    # Example, assuming BACKEND_CONTAINER_NAME=backend in .env
    docker-compose -f docker-compose.prod.yml exec backend npm run seed:fauxpas
    ```

6.  **Stop containers:**
    ```bash
    docker-compose -f docker-compose.prod.yml down
    ```
    To remove volumes: `docker-compose -f docker-compose.prod.yml down -v`

## Database Operations

These commands are typically run via `docker-compose exec <service_name_or_container_name> <command>`.
*   For development (`docker-compose.yml`): `fauxpas_backend_dev`
*   For production (`docker-compose.prod.yml`): `${BACKEND_CONTAINER_NAME}` from your `.env` file.

### Migrations

Prisma handles database schema migrations.
1.  **Generate a new migration (after changing `prisma/schema.prisma`):**
    ```bash
    # For dev
    docker-compose exec fauxpas_backend_dev npx prisma migrate dev --name your_migration_name
    # For prod (replace with your prod container name from .env)
    # docker-compose -f docker-compose.prod.yml exec ${BACKEND_CONTAINER_NAME} npx prisma migrate dev --name your_migration_name
    ```

2.  **Apply pending migrations (e.g., when setting up a new environment or deploying):**
    ```bash
    # For dev
    docker-compose exec fauxpas_backend_dev npx prisma migrate deploy
    # For prod
    # docker-compose -f docker-compose.prod.yml exec ${BACKEND_CONTAINER_NAME} npx prisma migrate deploy
    ```
    The `prestart` script in `backend/package.json` (`npm run build`) and the `Dockerfile` which runs `npx prisma generate` handle client generation. 

### Seeding

Populate the database with initial stories and questions.
*   `backend/src/scripts/faux_pas.ts`: Full set of Faux Pas questions.

To run the default seed script (`faux_pas.ts`):
```bash
# For dev
docker-compose exec fauxpas_backend_dev npm run seed:fauxpas
# For prod (using the container name from .env)
docker-compose -f docker-compose.prod.yml exec ${BACKEND_CONTAINER_NAME} npm run seed:fauxpas
```

## ML Model

*   Located in `ml_api/final_trained_model_with_validation/` (tracked by Git LFS).
*   The `ml_api` uses a Hugging Face Transformers `AutoModelForSequenceClassification`.
*   It evaluates `story`, `question`, and `answer` inputs.
*   The ML API Dockerfile installs PyTorch for CPU.
*   Health check: `http://<ml_api_host>:<ml_api_port>/health` (e.g., `http://localhost:8000/health` in dev).

## CI/CD - Docker Image Publishing

The `.github/workflows/docker-publish.yml` workflow:
*   Triggers on pushes to `master`, version tags (`v*.*.*`), and manual dispatch.
*   Logs into GitHub Container Registry (GHCR).
*   Builds Docker images for `backend`, `frontend`, and `ml_api` using their respective production Dockerfiles.
*   Pushes images to GHCR, tagged with:
    *   `latest`
    *   Commit SHA
    *   Git tag (if applicable)
*   Image names are constructed as `ghcr.io/<owner_lc>/<repo_name_lc>/fauxpas-<service_name>:tag`.
    Example: `ghcr.io/unhappybee/faux_pas_test/fauxpas-backend:latest`.
    Ensure your `.env` file's `*_IMAGE_NAME` variables match this pattern when pulling these images.


## Notes & Potential Improvements


*   **Database Initialization & Migrations (Production):** For production, consider a more robust database initialization/migration strategy than relying solely on application startup (e.g., a dedicated migration job in your deployment pipeline before the application starts, or an init container).

