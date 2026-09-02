# Task Manager

A full-stack, Trello/Jira-style project and task management application, built to practice designing and implementing a secure, multi-user REST API and connecting it to a modern React frontend.

## Features

- JWT-based authentication (register/login)
- Role-based project membership (owner/member) via a many-to-many relationship
- Create projects, invite members, and manage tasks on a Kanban-style board
- Drag-and-drop task status updates (To Do / In Progress / Done)
- Authorization checks to ensure users can only access projects they belong to
- Installable as a Progressive Web App (PWA) on desktop and mobile

## Tech Stack

**Backend**
- Java 25, Spring Boot (Web, Security, Data JPA)
- PostgreSQL
- JWT (jjwt)
- Maven
- Docker (for local PostgreSQL)

**Frontend**
- React + TypeScript
- Vite
- React Router
- Axios

## Architecture

The backend follows a layered architecture (Controller → Service → Repository) with stateless JWT authentication via a custom security filter. Project membership is modeled as its own entity (`ProjectMember`) linking users to projects with a role, enabling many-to-many membership with per-project permissions.

## Getting Started

### Backend

1. Start PostgreSQL locally with Docker:
```bash
   docker run --name taskmanager-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=taskmanager -p 5432:5432 -d postgres
```
2. Set the following environment variables in your run configuration:
