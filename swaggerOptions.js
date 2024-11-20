const swaggerJSDoc = require('swagger-jsdoc');

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',  // OpenAPI version
    info: {
      title: 'Product API',  // Title of the API
      version: '1.0.0',      // Version of the API
      description: 'A simple API for managing products',  // API description
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',  // The base URL of your API
        description: 'Local development server'
      }
    ]
  },
  apis: ['./index.js'],  // Path to the API routes that contain JSDoc annotations
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

module.exports = swaggerDocs;
