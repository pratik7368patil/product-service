// /models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      default: () => {
        return Math.round(Math.random() * 10000);
      },
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: false,
      trim: true,
      maxlength: [50, "Category cannot exceed 50 characters"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add error handling middleware
productSchema.post("save", function (error, doc, next) {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    error.status = 400;
    error.message = messages.join(", ");
  }
  next(error);
});

// Create a model based on the schema
const Product = mongoose.model("Product", productSchema);

export default Product;
