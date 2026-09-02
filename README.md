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
   DB_PASSWORD=yourpassword
   JWT_SECRET=your-secret-key-at-least-32-characters
3. Run the Spring Boot application from `task-manager/`.

### Frontend

```bash
cd task-manager-frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Overview

| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Log in and receive a JWT |
| GET | `/api/projects` | List projects the user belongs to |
| POST | `/api/projects` | Create a new project (creator becomes OWNER) |
| GET | `/api/projects/{id}` | Get a single project's details |
| GET | `/api/projects/{id}/members` | List a project's members and roles |
| POST | `/api/projects/{id}/members` | Add a member to a project by email |
| DELETE | `/api/projects/{id}/members/{memberId}` | Remove a member from a project |
| GET | `/api/projects/{id}/tasks` | List tasks in a project |
| POST | `/api/projects/{id}/tasks` | Create a task in a project |
| PATCH | `/api/projects/{id}/tasks/{taskId}/status` | Update a task's status |

## What I Learned

This project was built to practice full-stack development end-to-end: designing a relational data model with many-to-many relationships, implementing JWT authentication and authorization from scratch, handling CORS and security configuration, and connecting a React frontend to a REST API with protected routes.
