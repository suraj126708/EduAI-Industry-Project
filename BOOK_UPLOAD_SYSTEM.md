# Book Upload System

This document describes the book upload functionality implemented for the Exam Platform Upload page.

## Overview

The system allows teachers to upload PDF documents (study materials) for specific classes and subjects. The uploaded files are stored in the backend and their metadata is saved in the database.

## Backend Implementation

### Models Used

1. **Book** - Stores book information including file URL, title, author, year, and processing status
2. **BookSubjectClass** - Links books to specific subjects and classes
3. **VectorMetadataBook** - Stores vector metadata for AI processing (for future use)
4. **Subject** - Subject information
5. **Class** - Class information
6. **School** - School information
7. **Teacher** - Teacher information

### API Endpoints

- `POST /api/books/upload` - Upload a PDF book
- `GET /api/books` - Get all books (with pagination and filtering)
- `GET /api/books/:id` - Get book by ID
- `GET /api/books/filter` - Get books by class and subject filter
- `PUT /api/books/:id/status` - Update book processing status
- `DELETE /api/books/:id` - Delete book

### File Upload

- Files are stored in the `backend/uploads/` directory
- PDF files up to 50MB are supported
- Files are served statically at `/uploads/` endpoint
- Unique filenames are generated to prevent conflicts

### Authentication & Authorization

- Uses Firebase authentication
- Teachers and admins can upload books
- Users can only access books from their school (unless admin)
- Automatic teacher creation on first login

## Frontend Implementation

### ExamPlatformUpload Component

The component provides:

1. **Document Configuration Interface**

   - Class selection (01-12)
   - Subject selection (Mathematics, Physics, etc.)
   - PDF file upload
   - Multiple document rows support

2. **Upload Processing**

   - Real-time progress tracking
   - Step-by-step processing visualization
   - Error handling and display
   - Success/failure feedback

3. **Features**
   - Add/remove document rows
   - Clear pending inputs
   - Generated filename preview
   - Status tracking (pending/processed)

### API Integration

The frontend uses the `bookAPI` from `utils/api.js` to:

- Upload PDF files with metadata
- Handle authentication tokens
- Display upload results
- Manage error states

## Usage

1. **Teacher Login**: Teacher logs in using Firebase authentication
2. **Document Setup**: Teacher selects class, subject, and uploads PDF
3. **Processing**: System uploads file and creates database records
4. **Status Tracking**: Teacher can see processing status and results
5. **Management**: Teachers can view, update, or delete their uploaded books

## Database Schema

### Book Document

```javascript
{
  schoolId: ObjectId,
  classId: ObjectId,
  uploadedBy: ObjectId,
  title: String,
  author: String,
  year: Number,
  fileUrl: String,
  processedStatus: String, // "pending", "processed", "failed"
  createdAt: Date,
  updatedAt: Date
}
```

### BookSubjectClass Document

```javascript
{
  bookId: ObjectId,
  subjectId: ObjectId,
  classId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

- File validation (PDF only)
- Size limits (50MB max)
- Authentication errors
- Database errors
- Network errors
- User-friendly error messages

## Future Enhancements

- Vector processing for AI analysis
- Text extraction from PDFs
- Content validation
- Batch processing
- Cloud storage integration
- Advanced search and filtering
