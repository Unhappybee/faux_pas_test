# FauxPas - Social Cognition Assessment Platform

FauxPas is a web-based application designed to administer and evaluate the "Faux Pas Recognition Test". It allows users to register, take questionnaires based on social scenarios (stories), and receive scores evaluating their understanding of social cues, faux pas, intentions, beliefs, and emotions. The evaluation includes both rule-based scoring and an ML-based component for open-ended questions.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Git LFS](#2-git-lfs)
  - [3. Environment Variables](#3-environment-variables)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [Database Operations](#database-operations)
  - [Migrations](#migrations)
  - [Seeding](#seeding)
  - [Prisma Studio](#prisma-studio)
- [ML Model](#ml-model)
- [Deployment](#deployment)
- [Notes & Potential Improvements](#notes--potential-improvements)
- [Contributing](#contributing)

## Tech Stack

*   **Frontend:**
    *   React 19 with Vite
    *   TypeScript
    *   Axios for API communication
    *   React Router for navigation
    *   Headless UI for UI components
    *   React Hook Form & Zod for form management and validation
*   **Backend:**
    *   Node.js with Express.js
    *   TypeScript
    *   Prisma ORM
    *   PostgreSQL Database
*   **ML API:**
    *   Python 3.12 with FastAPI
    *   PyTorch (CPU version)
    *   Hugging Face Transformers (for `AutoTokenizer`, `AutoModelForSequenceClassification`)
    *   Uvicorn ASGI server
*   **Database:**
    *   PostgreSQL 15
*   **Containerization & CI/CD:**
    *   Docker & Docker Compose
    *   GitHub Actions
*   **Model Storage:**
    *   Git LFS (for `.safetensors` and `.bin` model files)

## Project Structure