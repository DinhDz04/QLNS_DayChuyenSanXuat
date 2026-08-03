# Custom Codebuff Agents

This directory holds custom agent definitions for the **QLNS – Quản lý Nhân sự Dây chuyền sản xuất** project.

Custom agents let you tailor Codebuff's behavior to this codebase (Express + MySQL backend, React + Vite frontend).

## Project overview

- **backend/** — Node.js (ESM) Express API using `mysql2`, `jsonwebtoken`, `bcrypt`, `multer`, `xlsx`.
  - Layered architecture: `routers/` → `controllers/` → `services/` → `models/` + `config/db.js`.
- **frontend/** — React 18 + Vite SPA using `react-router-dom`.
  - Feature-based structure under `src/features/*` (auth, ca-lam, day-chuyen, khu-vuc, nhan-su, dashboard), shared `components/`, `context/`, `hooks/`, and `services/`.

## Available custom agents

- **qlns-explorer** — Finds and explains code across the layered backend and feature-based frontend.
- **qlns-backend-dev** — Implements backend API changes following the router→controller→service→model convention.
- **qlns-frontend-dev** — Implements React feature changes following the existing feature-folder + service convention.

## Usage

Reference an agent in your prompt with `@qlns-backend-dev` (etc.), or Codebuff may spawn them automatically when relevant.

## Docs

See https://codebuff.com/docs for the full agent definition schema and options.
