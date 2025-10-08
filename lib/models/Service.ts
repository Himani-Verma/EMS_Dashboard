import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  name: string;
  description?: string;
  category: string; // main service category
  subServices: string[];
  isActive: boolean;
  pricing?: {
    basePrice: number;
    unit: string; // per sample, per test, per hour, etc.
    currency: string;
  };
  requirements?: string[];
  estimatedDuration?: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['Food Testing', 'Water Testing', 'Environmental Testing', 'Chemical Testing', 'Microbiology', 'Others'],
    index: true
  },
  subServices: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  pricing: {
    basePrice: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: 'per sample'
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  requirements: [{
    type: String,
    trim: true
  }],
  estimatedDuration: {
    type: String,
    default: '3-5 business days'
  }
}, {
  timestamps: true
});

// Indexes for better performance
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ name: 1 });
serviceSchema.index({ isActive: 1 });

// Create and export the model
const Service = mongoose.models.Service || mongoose.model<IService>('Service', serviceSchema);
export default Service;
