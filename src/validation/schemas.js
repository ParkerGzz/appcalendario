/**
 * Validation Schemas using Zod
 * Define all data structures and validation rules for the application
 */

import { z } from 'zod';

// ===== Location Schemas =====
export const LocationSchema = z.object({
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be less than 200 characters'),
  lat: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  lng: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  label: z.string()
    .min(1, 'Label is required')
    .max(50, 'Label must be less than 50 characters'),
  placeId: z.string().optional(),
  travelTime: z.number().int().nonnegative().optional() // minutes
});

export const LocationInputSchema = LocationSchema.partial().required({
  address: true,
  label: true
});

// ===== Task Schemas =====
export const PriorityEnum = z.enum(['baja', 'media', 'alta', 'urgente']);

export const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string()
    .min(3, 'Task title must be at least 3 characters')
    .max(100, 'Task title must be less than 100 characters'),
  duration: z.number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(1440, 'Duration cannot exceed 24 hours (1440 minutes)'),
  priority: PriorityEnum.default('media'),
  location: LocationSchema,
  deadline: z.date().optional(),
  windowStart: z.date().optional(),
  windowEnd: z.date().optional(),
  isFixed: z.boolean().default(false),
  completed: z.boolean().default(false),
  placeId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  busyness: z.object({
    percentage: z.number().min(0).max(100),
    description: z.string()
  }).optional(),
  notes: z.string().max(500).optional()
});

export const TaskCreateSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  busyness: true
});

export const TaskUpdateSchema = TaskCreateSchema.partial();

// ===== Work Schedule Schema =====
export const WorkScheduleSchema = z.object({
  startTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  endTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'),
  daysOfWeek: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]) // Monday-Friday
});

// ===== Settings Schema =====
export const TransportModeEnum = z.enum(['driving', 'transit', 'bicycling', 'walking']);

export const SettingsSchema = z.object({
  homeLocation: LocationSchema.optional(),
  workLocation: LocationSchema.optional(),
  homeToWorkTime: z.number().int().nonnegative().optional(), // minutes
  workToHomeTime: z.number().int().nonnegative().optional(), // minutes
  workSchedule: WorkScheduleSchema.default({
    startTime: '09:00',
    endTime: '18:00',
    daysOfWeek: [1, 2, 3, 4, 5]
  }),
  transportMode: TransportModeEnum.default('driving'),
  maxDetour: z.number()
    .min(0, 'Max detour cannot be negative')
    .max(120, 'Max detour cannot exceed 120 minutes')
    .default(10),
  // Optimization preferences
  locationClustering: z.boolean().default(true),
  clusterRadius: z.number()
    .min(500, 'Cluster radius must be at least 500 meters')
    .max(10000, 'Cluster radius cannot exceed 10 km')
    .default(2000),
  minimizeTravel: z.boolean().default(true),
  respectDeadlines: z.boolean().default(true),
  prefStartTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Preferred start time must be in HH:MM format')
    .default('09:00'),
  prefEndTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Preferred end time must be in HH:MM format')
    .default('18:00'),
  breakDuration: z.number()
    .min(0, 'Break duration cannot be negative')
    .max(60, 'Break duration cannot exceed 60 minutes')
    .default(15),
  maxDailyTasks: z.number()
    .min(1, 'Max daily tasks must be at least 1')
    .max(20, 'Max daily tasks cannot exceed 20')
    .default(8),
  // Priority weights
  priorityWeights: z.object({
    urgent: z.number().min(1).max(10).default(5.0),
    high: z.number().min(1).max(10).default(3.0),
    medium: z.number().min(1).max(10).default(2.0),
    low: z.number().min(1).max(10).default(1.0)
  }).default({
    urgent: 5.0,
    high: 3.0,
    medium: 2.0,
    low: 1.0
  })
});

// ===== User/Session Schema =====
export const UserSchema = z.object({
  id: z.string().optional(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(255, 'Password is too long'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const UserLoginSchema = UserSchema.pick({ email: true, password: true });

export const UserRegisterSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true });

// ===== Calendar Event Schema =====
export const CalendarEventSchema = z.object({
  id: z.string(),
  taskId: z.string().optional(),
  title: z.string().min(1),
  start: z.date(),
  end: z.date(),
  allDay: z.boolean().default(false),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  className: z.string().optional(),
  extendedProps: z.object({
    taskId: z.string().optional(),
    location: z.string().optional(),
    priority: PriorityEnum.optional(),
    busyness: z.object({
      percentage: z.number(),
      description: z.string()
    }).optional(),
    isFixed: z.boolean().optional()
  }).optional()
});

// ===== Suggestion Schema =====
export const SuggestionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['proximity', 'deadline', 'urgency', 'timing']),
  title: z.string(),
  description: z.string(),
  taskIds: z.array(z.string()),
  savings: z.object({
    time: z.number(), // minutes
    distance: z.number() // kilometers
  }).optional(),
  priority: z.number().min(0).max(100),
  createdAt: z.date().default(() => new Date())
});

// ===== Route Schema =====
export const RouteSchema = z.object({
  id: z.string().optional(),
  origin: LocationSchema,
  destination: LocationSchema,
  waypoints: z.array(LocationSchema).default([]),
  mode: TransportModeEnum,
  distance: z.number(), // kilometers
  duration: z.number(), // minutes
  steps: z.array(z.object({
    instruction: z.string(),
    distance: z.number(),
    duration: z.number()
  })).optional(),
  polyline: z.string().optional(),
  createdAt: z.date().default(() => new Date())
});

// ===== Global App State Schema =====
export const AppStateSchema = z.object({
  currentView: z.enum(['dashboard', 'calendar', 'tasks', 'routePlanner', 'settings']).default('dashboard'),
  tasks: z.array(TaskSchema).default([]),
  settings: SettingsSchema.default({}),
  selectedDate: z.date().optional(),
  isLoading: z.boolean().default(false),
  error: z.string().optional(),
  notifications: z.array(z.object({
    id: z.string(),
    message: z.string(),
    type: z.enum(['success', 'error', 'warning', 'info']),
    duration: z.number().optional()
  })).default([])
});

// ===== Validation Helper Functions =====
export const validateTask = (data) => {
  try {
    return { success: true, data: TaskCreateSchema.parse(data) };
  } catch (error) {
    return { success: false, error: error.errors };
  }
};

export const validateLocation = (data) => {
  try {
    return { success: true, data: LocationSchema.parse(data) };
  } catch (error) {
    return { success: false, error: error.errors };
  }
};

export const validateSettings = (data) => {
  try {
    return { success: true, data: SettingsSchema.parse(data) };
  } catch (error) {
    return { success: false, error: error.errors };
  }
};

export const validateEmail = (email) => {
  const schema = z.string().email();
  try {
    schema.parse(email);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Invalid email format' };
  }
};

export const validatePassword = (password) => {
  const schema = z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
  try {
    schema.parse(password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.errors[0]?.message };
  }
};

export const validateDates = (startDate, endDate) => {
  const schema = z.object({
    start: z.date(),
    end: z.date().refine(
      (date) => date > startDate,
      'End date must be after start date'
    )
  });
  try {
    schema.parse({ start: startDate, end: endDate });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.errors[0]?.message };
  }
};

export default {
  // Schemas
  LocationSchema,
  TaskSchema,
  WorkScheduleSchema,
  SettingsSchema,
  UserSchema,
  CalendarEventSchema,
  SuggestionSchema,
  RouteSchema,
  AppStateSchema,

  // Helper functions
  validateTask,
  validateLocation,
  validateSettings,
  validateEmail,
  validatePassword,
  validateDates
};
