import { ScheduleEvent } from '../types';

const STORAGE_KEY = 'my_timetable_events';

// Mimics a DAO
export const EventService = {
  getAllEvents: (): ScheduleEvent[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load events", e);
      return [];
    }
  },

  saveEvents: (events: ScheduleEvent[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error("Failed to save events", e);
    }
  },

  insert: (event: ScheduleEvent) => {
    const events = EventService.getAllEvents();
    events.push(event);
    EventService.saveEvents(events);
    return events;
  },

  insertAll: (newEvents: ScheduleEvent[]) => {
    const events = EventService.getAllEvents();
    // We append new events. In a real DB we might check conflicts, but for copy feature we just append.
    const updatedEvents = [...events, ...newEvents];
    EventService.saveEvents(updatedEvents);
    return updatedEvents;
  },

  update: (updatedEvent: ScheduleEvent) => {
    const events = EventService.getAllEvents();
    const index = events.findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
        events[index] = updatedEvent;
        EventService.saveEvents(events);
    }
    return events;
  },

  deleteEvent: (id: string) => {
    const events = EventService.getAllEvents();
    const updatedEvents = events.filter(e => e.id !== id);
    EventService.saveEvents(updatedEvents);
    return updatedEvents;
  },

  deleteEventsByGroupId: (groupId: string) => {
    const events = EventService.getAllEvents();
    const updatedEvents = events.filter(e => e.groupId !== groupId);
    EventService.saveEvents(updatedEvents);
    return updatedEvents;
  },

  getEventsByDate: (date: string): ScheduleEvent[] => {
    const events = EventService.getAllEvents();
    return events.filter(e => e.date === date);
  }
};