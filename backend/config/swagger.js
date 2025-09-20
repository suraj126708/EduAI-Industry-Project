import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Teacher Management System API",
      version: "1.0.0",
      description:
        "API documentation for Teacher Management System - A comprehensive platform for managing teachers, students, classes, subjects, and educational resources.",
      contact: {
        name: "API Support",
        email: "support@teachermanagement.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://api.teachermanagement.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for authentication",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Success message",
            },
            data: {
              type: "object",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            email: {
              type: "string",
              format: "email",
              example: "teacher@example.com",
            },
            role: {
              type: "string",
              enum: ["teacher", "admin"],
              example: "teacher",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Teacher: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@school.com",
            },
            phone: {
              type: "string",
              example: "+1234567890",
            },
            subjects: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["Mathematics", "Physics"],
            },
            classes: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["10A", "10B"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Student: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              example: "Jane Smith",
            },
            rollNumber: {
              type: "string",
              example: "2024001",
            },
            class: {
              type: "string",
              example: "10A",
            },
            subjects: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["Mathematics", "Physics", "Chemistry"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Book: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            title: {
              type: "string",
              example: "Advanced Mathematics",
            },
            author: {
              type: "string",
              example: "Dr. Smith",
            },
            subject: {
              type: "string",
              example: "Mathematics",
            },
            class: {
              type: "string",
              example: "10",
            },
            isbn: {
              type: "string",
              example: "978-1234567890",
            },
            description: {
              type: "string",
              example: "Comprehensive guide to advanced mathematics",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js", "./models/*.js"],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
