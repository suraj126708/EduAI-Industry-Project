## 📚 Teacher Management Backend (Node.js API)

**A role‑based backend for managing schools, teachers, books, exams, and AI‑assisted evaluation.**  
This service exposes REST APIs consumed by the frontend and the AI assessment engine.

---

## 🛠 Tech Stack

- **Runtime**: Node.js, Express  
- **Database**: MongoDB (via Mongoose)  
- **Auth & Identity**: Firebase Authentication (ID tokens, custom tokens)  
- **Security & Ops**: `helmet`, CORS, `morgan`  
- **File Handling**: Multer (PDFs, answer sheets)  
- **Docs**: Swagger UI (`/api-docs`)

---

## 🔌 Base URL & Authentication

- **Base URL (local)**: `http://localhost:<PORT>` (default `5000`)  
- **Health Check**: `GET /api/health`  
- **Auth model**:
  - Every protected route expects a **Firebase ID token** in  
    `Authorization: Bearer <firebase_id_token>`
  - Role‑based access using roles like `teacher`, `admin`, `principal`, `superadmin`
- **API Docs (Swagger)**: `GET /api-docs` – full schemas and example payloads

---

## 🧱 High‑Level Modules

- **Authentication (`/api/auth`)**: Register teachers, manage profile, verify tokens, issue custom tokens.  
- **Teacher (`/api/teachers`)**: Teacher profile management, book uploads, question paper generation, students/assignments.  
- **Admin (`/api/admin`)**: System dashboard, teachers, students, schools, classes, subjects, assignments.  
- **Superadmin (`/api/superadmin`)**: Cross‑school operations (create/list schools).  
- **Evaluation (`/api/evaluation`)**: Upload answer sheets, retrieve/update evaluations, and manage semester reports.

---

## 🔍 Core Routes & Contracts


### 1. Teacher Routes (`/api/teachers`)

> Role varies per route (`teacher`, `principal`, or `admin`).

- **GET `/api/teachers/fetch-books-metadata`**  
  - **Auth**: `teacher` or `principal`  
  - **Query (typical)**: `classId`, `subject`  
  - **Purpose**: Retrieve uploaded book metadata (used for exam generation UI).  
  - **Response**: `{ success, books: [...] }`

- **GET `/api/teachers/chapters`**  
  - **Auth**: `teacher` or `principal`  
  - **Query**: typically `classId`, `subject`, `bookId`  
  - **Purpose**: Fetch chapter list for a given class/subject/book.  
  - **Response**: `{ success, chapters: [...] }`

- **GET `/api/teachers/my-books`**  
  - **Auth**: `teacher` or `principal`  
  - **Purpose**: List only the books uploaded by the current teacher.  
  - **Response**: `{ success, books: [...] }`

- **GET `/api/teachers/my-question-papers`**  
  - **Auth**: `teacher` or `principal`  
  - **Purpose**: List all question papers created by the current teacher.  
  - **Response**: `{ success, papers: [...] }`

- **GET `/api/teachers/my-question-papers-grouped`**  
  - **Auth**: `teacher` or `principal`  
  - **Purpose**: Same papers as above, but grouped (e.g. by class, subject, or exam type) for dashboards.  
  - **Response**: `{ success, groups: [...] }`

- **GET `/api/teachers/students-by-class`**  
  - **Auth**: `teacher` or `principal`  
  - **Query**: e.g. `classId`, `division`  
  - **Purpose**: Fetch students list for a class/division assigned to the teacher.  
  - **Response**: `{ success, students: [...] }`

- **DELETE `/api/teachers/books/:bookId`**  
  - **Auth**: `teacher` or `principal`  
  - **Params**: `bookId` (Mongo ObjectId)  
  - **Purpose**: Remove an uploaded book (and related metadata) for that teacher.  
  - **Response**: `{ success, message }`

- **PUT `/api/teachers/question-papers/:id`**  
  - **Auth**: `teacher` or `principal`  
  - **Body (JSON)**: Updated paper structure (title, sections, questions, etc.)  
  - **Purpose**: Edit an existing question paper.  
  - **Response**: `{ success, message, paper }`

- **DELETE `/api/teachers/question-papers`**  
  - **Auth**: `teacher` or `principal`  
  - **Body (JSON)**: Filter/IDs to delete (implementation specific).  
  - **Purpose**: Delete one or more question papers owned by the teacher.  
  - **Response**: `{ success, message }`


- **MAIN ROUTES UPLOAD-BOOK AND GENERATE-QUESTION-PAPER

- **POST `/api/teachers/upload-book`**  
  - **Auth**: `teacher` or `principal`  
  - **Content-Type**: `multipart/form-data`  
  - **Form fields**:
    - File: `pdf` (the textbook PDF)  
    - Body fields (all required): `classId`, `subject`, `author`, `year`, `schoolId`, `teacherId` (Firebase UID), `title`
  - **Purpose**: Upload a book, store metadata, and hand it off to the AI service for indexing.  
  - **Response**: `{ success, message, book }` (plus any processing status)

- **POST `/api/teachers/generate-question-paper`**  
  - **Auth**: `teacher` or `principal`  
  - **Body (JSON)** (key fields):
    - `class` (string)  
    - `subject` (string)  
    - `bookId` (string, required – links to uploaded book)  
    - `numberofPapers` (integer, default `1`)  
    - `duration` (string or number)  
    - `totalMarks` (number)  
    - `examType` (string)  
    - plus any question‑level config forwarded to AI
  - **Purpose**: Calls the AI service (`generate_question_paper/`) using the selected book and configuration, then stores the generated paper(s).  
  - **Response**: `{ success, papers: [...] }` or similar; AI response normalized to an array.

---

### 2. Evaluation Routes (`/api/evaluation`)

- **POST `/api/evaluation/upload`**  
  - **Auth**: `teacher` or `principal`  
  - **Content-Type**: `multipart/form-data`  
  - **Form fields**:
    - File: `answerSheet` (PDF/image)  
    - Additional metadata in body (class, division, exam details, paperId, etc.)
  - **Purpose**: Upload a student answer sheet for AI evaluation.  
  - **Response**: `{ success, message, evaluationId }`


- **PUT `/api/evaluation/update/:id`**  
  - **Auth**: `teacher` or `principal`  
  - **Body (JSON)**: Manual corrections or overrides to the evaluation.  
  - **Purpose**: Let teachers adjust AI‑generated marks/feedback.  
  - **Response**: `{ success, message, report }`

- **POST `/api/evaluation/semester`**  
  - **Auth**: `teacher` or `principal`  
  - **Body (JSON)**: Class, term, subject and aggregation config.  
  - **Purpose**: Generate a semester report aggregating multiple evaluations.  
  - **Response**: `{ success, message, semesterReportId }`

- **GET `/api/evaluation/semester-report/:id`**  
  - **Auth**: `principal`  
  - **Params**: `id` (semester report ID)  
  - **Purpose**: Retrieve a consolidated semester report for a class/section.  
  - **Response**: `{ success, report }`
---

## 🧪 Local Setup & Run

- **Install dependencies** (in `backend` folder):

```bash
npm install
```

- **Environment variables** (example keys – adapt to your `.env`):

```ini
PORT=5000
MONGODB_URI=<your-mongo-uri>
NODE_ENV=development

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."

AI_SERVICE_BASE_URL=http://localhost:8000/api/exams/
```

- **Start the server**:

```bash
npm run dev   # or: node server.js
```

- Then open:
  - **Health**: `GET /api/health`  
  - **Docs**: `GET /api-docs` (interactive route & schema explorer)


