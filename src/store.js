/**
 * Zustand Store - Centralized Reactive State Management
 * Handles all application state with auto-persistence to localStorage
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { validateTask, validateLocation, validateSettings } from './validation/schemas.js';

/**
 * Create the main application store
 * Features:
 * - Redux DevTools integration (dev only)
 * - localStorage persistence
 * - Subscription to specific state slices
 */
export const useAppStore = create(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // ===== STATE =====

        // View & UI State
        currentView: 'dashboard',
        isLoading: false,
        error: null,
        notifications: [],
        selectedDate: null,

        // Tasks
        tasks: [],
        filteredTasks: [],

        // Locations
        homeLocation: null,
        workLocation: null,
        currentLocation: null,

        // Settings
        workSchedule: {
          startTime: '09:00',
          endTime: '18:00',
          daysOfWeek: [1, 2, 3, 4, 5]
        },
        settings: {
          transportMode: 'driving',
          maxDetour: 10,
          locationClustering: true,
          clusterRadius: 2000,
          minimizeTravel: true,
          respectDeadlines: true,
          priorityWeights: {
            urgent: 5.0,
            high: 3.0,
            medium: 2.0,
            low: 1.0
          }
        },

        // ===== ACTIONS =====

        // View Actions
        setCurrentView: (view) => set({ currentView: view }),
        setSelectedDate: (date) => set({ selectedDate: date }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        // Notification Actions
        addNotification: (message, type = 'info', duration = 3000) => {
          const id = Date.now().toString();
          set((state) => ({
            notifications: [
              ...state.notifications,
              { id, message, type, duration }
            ]
          }));
          // Auto-remove after duration
          if (duration > 0) {
            setTimeout(() => get().removeNotification(id), duration);
          }
          return id;
        },

        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        })),

        clearNotifications: () => set({ notifications: [] }),

        // Task Actions
        addTask: (taskData) => {
          const validation = validateTask(taskData);
          if (!validation.success) {
            get().addNotification(
              `Task validation failed: ${validation.error[0]?.message}`,
              'error'
            );
            return null;
          }

          const task = {
            id: `task-${Date.now()}`,
            ...validation.data,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          set((state) => ({
            tasks: [...state.tasks, task]
          }));

          get().addNotification('✅ Task created successfully', 'success');
          return task;
        },

        updateTask: (taskId, updates) => {
          const state = get();
          const task = state.tasks.find((t) => t.id === taskId);

          if (!task) {
            get().addNotification('Task not found', 'error');
            return null;
          }

          const updatedTask = { ...task, ...updates, updatedAt: new Date() };
          const validation = validateTask(updatedTask);

          if (!validation.success) {
            get().addNotification(
              `Update validation failed: ${validation.error[0]?.message}`,
              'error'
            );
            return null;
          }

          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t))
          }));

          get().addNotification('✅ Task updated', 'success');
          return updatedTask;
        },

        deleteTask: (taskId) => {
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== taskId)
          }));
          get().addNotification('✅ Task deleted', 'success');
        },

        getTasks: () => get().tasks,

        getTaskById: (taskId) => get().tasks.find((t) => t.id === taskId),

        getTasksByPriority: (priority) =>
          get().tasks.filter((t) => t.priority === priority),

        getTasksByDate: (date) =>
          get().tasks.filter(
            (t) =>
              t.deadline &&
              new Date(t.deadline).toDateString() === date.toDateString()
          ),

        getTasksByLocation: (locationAddress) =>
          get().tasks.filter(
            (t) =>
              t.location.address.toLowerCase() ===
              locationAddress.toLowerCase()
          ),

        // Location Actions
        setHomeLocation: (location) => {
          const validation = validateLocation(location);
          if (!validation.success) {
            get().addNotification(
              `Location validation failed: ${validation.error[0]?.message}`,
              'error'
            );
            return false;
          }
          set({ homeLocation: validation.data });
          get().addNotification('✅ Home location saved', 'success');
          return true;
        },

        setWorkLocation: (location) => {
          const validation = validateLocation(location);
          if (!validation.success) {
            get().addNotification(
              `Location validation failed: ${validation.error[0]?.message}`,
              'error'
            );
            return false;
          }
          set({ workLocation: validation.data });
          get().addNotification('✅ Work location saved', 'success');
          return true;
        },

        setCurrentLocation: (location) => set({ currentLocation: location }),

        // Settings Actions
        updateSettings: (newSettings) => {
          const state = get();
          const merged = { ...state.settings, ...newSettings };
          const validation = validateSettings(merged);

          if (!validation.success) {
            get().addNotification(
              `Settings validation failed: ${validation.error[0]?.message}`,
              'error'
            );
            return false;
          }

          set({ settings: validation.data });
          get().addNotification('✅ Settings updated', 'success');
          return true;
        },

        updateWorkSchedule: (schedule) => {
          set({ workSchedule: schedule });
          get().addNotification('✅ Work schedule updated', 'success');
        },

        getSettings: () => get().settings,

        // Filter & Search Actions
        filterTasks: (predicate) => {
          const filtered = get().tasks.filter(predicate);
          set({ filteredTasks: filtered });
          return filtered;
        },

        searchTasks: (query) => {
          const lowercaseQuery = query.toLowerCase();
          return get().filterTasks(
            (task) =>
              task.title.toLowerCase().includes(lowercaseQuery) ||
              task.location.address.toLowerCase().includes(lowercaseQuery) ||
              (task.notes?.toLowerCase().includes(lowercaseQuery) || false)
          );
        },

        // Batch Operations
        clearAllTasks: () => {
          set({ tasks: [] });
          get().addNotification('All tasks cleared', 'warning');
        },

        bulkUpdateTasks: (taskIds, updates) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              taskIds.includes(task.id)
                ? { ...task, ...updates, updatedAt: new Date() }
                : task
            )
          }));
          get().addNotification(
            `✅ ${taskIds.length} tasks updated`,
            'success'
          );
        },

        // Reset Actions
        reset: () =>
          set({
            currentView: 'dashboard',
            isLoading: false,
            error: null,
            notifications: [],
            tasks: [],
            filteredTasks: [],
            homeLocation: null,
            workLocation: null,
            currentLocation: null,
            selectedDate: null
          })
      })),
      {
        name: 'calendar-store', // localStorage key
        partialize: (state) => ({
          // Only persist essential data
          tasks: state.tasks,
          homeLocation: state.homeLocation,
          workLocation: state.workLocation,
          workSchedule: state.workSchedule,
          settings: state.settings
        })
      }
    )
  )
);

/**
 * Create a hook for efficient selectors
 * Usage: const tasks = useAppStore(state => state.tasks)
 */
export const useAppState = useAppStore;

/**
 * Create specific store hooks for common use cases
 */
export const useTasks = () =>
  useAppStore((state) => ({
    tasks: state.tasks,
    addTask: state.addTask,
    updateTask: state.updateTask,
    deleteTask: state.deleteTask,
    getTaskById: state.getTaskById
  }));

export const useLocations = () =>
  useAppStore((state) => ({
    homeLocation: state.homeLocation,
    workLocation: state.workLocation,
    setHomeLocation: state.setHomeLocation,
    setWorkLocation: state.setWorkLocation
  }));

export const useSettings = () =>
  useAppStore((state) => ({
    settings: state.settings,
    workSchedule: state.workSchedule,
    updateSettings: state.updateSettings,
    updateWorkSchedule: state.updateWorkSchedule
  }));

export const useNotifications = () =>
  useAppStore((state) => ({
    notifications: state.notifications,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications
  }));

export const useUI = () =>
  useAppStore((state) => ({
    currentView: state.currentView,
    setCurrentView: state.setCurrentView,
    isLoading: state.isLoading,
    setLoading: state.setLoading,
    error: state.error,
    setError: state.setError
  }));

export default useAppStore;
