// Import Express.js
import Product from './models/Product.js';
import express from 'express'
import bodyParser from 'body-parser'
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid'; // To generate unique IDs for each product
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
// MongoDB connection URI
const mongoURI = "mongodb+srv://2023mt93322:q7UyZUwjWxfw9o5t@cluster0.821q7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const router = express.Router();

// This variable defines the port of your computer where the API will be available
const PORT = 3000

// This variable instantiate the Express.js library
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json()); // Middleware to parse JSON bodies

const swaggerOptions = {
  definition: {
    openapi: '3.0.0', // OpenAPI version
    info: {
      title: 'Product API', // API Title
      description: 'API documentation for product management', // Description of API
      version: '1.0.0', // Version
    },
  },
  apis: ['./index.js'], // Path to your routes (this will reference the annotations inside your index.js)
};

// Generate Swagger specification from the above options
const swaggerSpec = swaggerJsdoc(swaggerOptions);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.listen(PORT, () =>
  console.log(`The Products  API is running on: http://localhost:${PORT}.`)
)

// Connect to MongoDB
let db;
let productsCollection;

MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db('productDB'); // Use your database name
    productsCollection = db.collection('products'); // Use your collection name
    console.log('Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB Atlas', err);
    process.exit(1); // Exit if the connection fails
  });

//To list all Products-START 

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of all products from the MongoDB database
 *     responses:
 *       200:
 *         description: List of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "609d3b0c9f1b2d00fcbba1f3"
 *                   name:
 *                     type: string
 *                     example: "Product 1"
 *                   price:
 *                     type: number
 *                     example: 20.5
 *       404:
 *         description: No products found
 *       500:
 *         description: Internal server error
 */

app.get('/products', async (request, response) => {
  try {
    // Fetch products from MongoDB
    const products = await productsCollection.find().toArray();

    // If there are no products in the database, return a 404 error
    if (products.length === 0) {
      return response.status(404).json({ success: false, message: 'No products found' });
    }

    // Return the list of products
    return response.status(200).json({
      success: true,
      products: products // Return all the products from MongoDB
    });
  } catch (error) {
    // In case of any error, send a 500 status
    return response.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

//To list all Products - END 

//Addition of Products-START

/**
 * @swagger
 * /addproducts:
 *   post:
 *     summary: Add a new product to the list
 *     tags:
 *       - Products
 *     requestBody:
 *       description: Product object to be added
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Product A'
 *               description:
 *                 type: string
 *                 example: 'A product description'
 *               price:
 *                 type: number
 *                 example: 29.99
 *               category:
 *                 type: string
 *                 example: 'Electronics'
 *     responses:
 *       200:
 *         description: Product added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Product added successfully'
 *       400:
 *         description: Bad request, missing fields
 *       500:
 *         description: Internal server error
 */

 
const productSchema = Joi.object({
  name: Joi.string()
    .min(3)  // Minimum length of 3 characters
    .max(20)  // Maximum length of 20 characters
    .pattern(/^[a-zA-Z0-9\s\-]+$/)  // Only allow alphanumeric characters, spaces, and hyphens
    .required()
    .messages({
      'string.base': `"Name" should be a type of 'text'`,
      'string.empty': `"Name" cannot be empty`,
      'string.min': `"Name" should have a minimum length of {#limit}`,
      'string.max': `"Name" should have a maximum length of {#limit}`,
      'string.pattern.base': `"Name" contains invalid characters, only letters, numbers, spaces, and hyphens are allowed`,
      'any.required': `"Name" is a required field`
    }),
  description: Joi.string().max(500).optional(),  // Optional description
  price: Joi.number().min(0).required().messages({
    'number.base': `"Price" should be a valid number`,
    'any.required': `"Price" is a required field`
  }),
  category: Joi.string().max(50).optional()  // Optional category
});

// POST endpoint to add a new product
app.post('/addproducts', async (request, response) => {
  // Log the request body to inspect what is being sent
  console.log('Request Body:', request.body);

  // Get the product data from the request body
  const { name, description, price, category } = request.body;

  // Validate the product data using the Joi schema
  const { error } = productSchema.validate({ name, description, price, category });

  // If validation fails, return an error response with the custom error message
  if (error) {
    return response.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    // Check if the product already exists in the database
    const existingProduct = await productsCollection.findOne({ name });

    if (existingProduct) {
      return response.status(409).json({ success: false, message: 'Product with this name already exists' });
    }

    // Create the new product object
    const newProduct = {
      name,
      description,
      price,
      category,
      createdAt: new Date()  // Optionally add a timestamp for when the product is created
    };

    // Insert the new product into MongoDB
    const result = await productsCollection.insertOne(newProduct);

    // Check if the insertion was successful and return the inserted product data
    if (result.acknowledged) {
      // Retrieve the inserted product from the result using the insertedId
      const insertedProduct = {
        ...newProduct,
        _id: result.insertedId // Add MongoDB-generated _id to the new product
      };

      return response.status(201).json({
        success: true,
        message: 'Product added successfully',
        product: insertedProduct  // Return the created product with its MongoDB _id
      });
    } else {
      return response.status(500).json({ success: false, message: 'Failed to add product' });
    }
  } catch (error) {
    // Handle any errors that occurred during the database operation
    console.error('Error inserting product:', error);
    return response.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

//Addition of Products - END

// Delete Product API (by ID)-START

/**
 * @swagger
 * /deleteproducts:
 *   delete:
 *     summary: Delete a product by ID (soft delete)
 *     description: Soft delete a product by ID by setting the `deletedAt` timestamp in MongoDB
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Product ID to be deleted
 *                 example: "609d3b0c9f1b2d00fcbba1f3"
 *     responses:
 *       200:
 *         description: Product soft-deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product soft-deleted successfully
 *                 deletedProduct:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "609d3b0c9f1b2d00fcbba1f3"
 *                     name:
 *                       type: string
 *                       example: "Product 1"
 *                     deletedAt:
 *                       type: string
 *                       example: "2021-07-01T12:34:56Z"
 *       400:
 *         description: Bad request - Missing or invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */

app.delete('/deleteproducts', async (request, response) => {
    const { id } = request.body;  // Get product ID from the body

    if (!id) {
        return response.status(400).json({
            success: false,
            message: 'Product ID is required'
        });
    }

    if (!ObjectId.isValid(id)) {
        return response.status(400).json({
            success: false,
            message: 'Invalid product ID format'
        });
    }

    try {
        // 1. Fetch the product details before soft deleting it
        const productToDelete = await productsCollection.findOne({ _id: new ObjectId(id) });

        if (!productToDelete) {
            return response.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // 2. Perform the soft delete by setting the `deletedAt` field
        const result = await productsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { deletedAt: new Date() } }  // Mark as deleted with timestamp
        );

        // 3. Return a success response with the deleted product details
        return response.status(200).json({
            success: true,
            message: 'Product soft-deleted successfully',
            deletedProduct: productToDelete // Return the product data before soft delete
        });
    } catch (error) {
        console.error('Error soft-deleting product:', error);
        return response.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
});

// Delete Product API (by ID)-END
