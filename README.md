# EDUAI: Intelligent Exam Infrastructure 🎓

> **Team EDUAI** | **TechFiesta 2026**

![Status](https://img.shields.io/badge/Status-Prototype_Ready-success)
![Stack](https://img.shields.io/badge/Stack-FastAPI_|_React_|_Groq_|_VertexAI-blue)

---

## 🌟 Overview

**EDUAI** is an advanced AI-powered platform designed to automate the **entire assessment lifecycle** for educational institutions.  
From ingesting complex textbooks to generating syllabus-aligned question papers and **strictly evaluating handwritten answer sheets**, EDUAI bridges the gap between traditional education workflows and modern AI systems.

---

## 🚀 Problem Statement & Solution

### ❌ The Problem

Educators spend **30–40% of their time** manually:

- Drafting question papers
- Formatting exams
- Evaluating handwritten answer sheets

Generic AI tools often:

- Hallucinate content
- Fail to align with a **specific syllabus**

### ✅ The EDUAI Solution

- **Context-Aware AI:** Ingests _exact textbooks_, not generic prompts
- **Strict Evaluation:** Zero-tolerance comparison with AI-generated answer keys
- **Multimodal Understanding:** Text, diagrams, and equations processed together

---

## 🔐 Demo Teacher Login (For Testing)

**Demo Credentials (Teacher Role):**

```

Email:    [suraj9890@gmail.com](mailto:suraj9890@gmail.com)
Password: [suraj9890@gmail.com](mailto:suraj9890@gmail.com)

```

⚠️ _Restricted demo account for evaluation purposes only._

---

## 📸 System Walkthrough (User Journey)

### 1. Authentication & Dashboard

_Secure entry point for Teachers and Administrators._

|                                                      Login Page                                                      |                                                     Home Dashboard                                                      |
| :------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------: |
| ![Login Page](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/LoginPage.png) | ![Home Screen](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/HomeScreeen.png) |

---

### 2. Knowledge Ingestion (RAG)

_Textbook upload, multimodal chunking, and TOC extraction._

|                                                     Upload Interface                                                     |                                                       Book Management                                                        |
| :----------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------: |
| ![Upload Books](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/UploadBooks.png) | ![Uploaded Books](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/UploadedBooks.png) |

---

### 3. Exam Orchestration

_Configure Bloom’s taxonomy, difficulty, and syllabus coverage._

|                                                         Configuration                                                          |                                                     Paper Editor                                                     |
| :----------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------: |
| ![Generate Papers](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/Generatepapers.png) | ![Edit Paper](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/EditPaper.png) |

---

### 4. Exam Output

_Professionally formatted PDFs with AI-generated diagrams._

|                                                    Question Set View                                                     |                                                        All Papers Preview                                                         |
| :----------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: |
| ![Question Set](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/QuestionSet.png) | ![My Question Paper](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/MyQuestionpaper.png) |

---

### 5. Automated Evaluation

_Handwriting OCR, strict answer matching, and analytics._

|                                                             Script Upload                                                             |                                                       Performance Report                                                       |
| :-----------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
| ![Answer Sheet Upload](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/AnswerSheetUpload.png) | [View Sample Report (PDF)](https://raw.githubusercontent.com/suraj126708/EduAI-Industry-Project/showcase-v1/Photos/Report.pdf) |

---

## ⚙️ Key Innovations

- **Smart Textbook Ingestion**  
  Gemini 2.5 Flash performs multimodal extraction (text, formulas, diagrams) with TOC-aware chunking.

- **Hybrid AI Orchestration**

  - **Groq (Llama-3.3-70B):** Ultra-fast question generation & structured JSON
  - **Vertex AI (Gemini 2.5 Flash):** OCR, grading logic, and visual generation

- **“The Artist” Module**  
  Auto-generates **subject-specific diagrams** (Biology, Geography, Science) embedded directly into papers.

- **Cloud Index Sync**  
  FAISS indices synced to **Hugging Face Datasets** for persistence across stateless deployments.

---

## 🏗️ Technical Architecture

### Tech Stack

| Layer      | Technology                         | Purpose                |
| ---------- | ---------------------------------- | ---------------------- |
| Frontend   | React 19, Vite, Tailwind, Firebase | UI & Authentication    |
| Backend    | Python (FastAPI)                   | API & AI Orchestration |
| Vector DB  | FAISS (Local + HF Sync)            | Context Storage        |
| Text LLM   | Groq (Llama-3.3-70B)               | Question Generation    |
| Vision LLM | Vertex AI (Gemini 2.5 Flash)       | OCR & Evaluation       |
| Embedding  | HuggingFace (all-MiniLM-L6-v2)     | Vectorization          |

---

### Data Pipeline Flow

1. **Ingest**  
   PDF → Image Conversion → Gemini Vision → Structured Extraction → FAISS

2. **Generate**  
   User Config → Filtered Retrieval → Groq JSON → Vertex Diagrams → PDF

3. **Evaluate**  
   Answer Sheet → OCR → Logical Comparison → Marks & Remarks

---

## 💻 Installation & Setup

### Prerequisites

- **Node.js** v18+
- **Python** v3.10+
- **Poppler Utils**

```bash
# Linux
sudo apt-get install poppler-utils

# macOS
brew install poppler
```

---

### 1. Clone Repository

```bash
git clone <repository-url>
cd EDUAI
```

---

### 2. Backend Setup

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

### 🌐 Frontend (`frontend/.env`)

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

### 🖥️ Backend (`.env`)

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nKEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_CLIENT_ID=your_client_id

PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=24h
```

⚠️ **Do not commit this file**

---

## 📡 API Documentation

After starting backend:

```
http://localhost:8000/docs
```

### Endpoints

- `POST /process_pdf/` – Textbook ingestion
- `POST /generate_question_paper/` – Question paper generation
- `POST /evaluate_answer_paper/` – Handwritten answer evaluation

---

## 🔒 Security Notes

- `.env` files must be in `.gitignore`
- Firebase frontend keys are public by design
- Backend Firebase credentials grant admin access
- Use separate Firebase projects for **dev** and **prod**

---

## © License

Developed for **TECHFIESTA’26** © 2025
