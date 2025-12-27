import React, { useState, useEffect } from 'react';
import { MonthView } from './components/MonthView';
import { DayView } from './components/DayView';
import { AddEventModal } from './components/AddEventModal';
import { EventService } from './services/db';
import { ScheduleEvent } from './types';
import { formatDate, generateUUID } from './utils/dateUtils';

type ViewState = 'month' | 'day';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('month');
  
  // Undo History State
  const [history, setHistory] = useState<ScheduleEvent[][]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartMinute, setModalStartMinute] = useState(8 * 60);
  const [modalDuration, setModalDuration] = useState(60);

  // Load events on mount
  useEffect(() => {
    setEvents(EventService.getAllEvents());
  }, []);

  // Helper to save current state to history before making changes
  const pushToHistory = () => {
    setHistory(prev => [...prev, [...events]]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    // Get the last state
    const previousState = history[history.length - 1];
    
    // Remove the last state from history
    setHistory(prev => prev.slice(0, -1));
    
    // Restore events
    setEvents(previousState);
    EventService.saveEvents(previousState);
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setCurrentView('day');
  };

  const handleBackToMonth = () => {
    setCurrentView('month');
  };

  const handleCopyEvents = (sourceDateStr: string, targetDateStrs: string[]) => {
    // Save state before modification
    pushToHistory();

    // 1. Get all events from the source date
    const sourceEvents = events.filter(e => e.date === sourceDateStr);
    
    if (sourceEvents.length === 0) return;

    let updatedEventsList = [...events];
    const eventsToDeleteIds = new Set<string>();
    const newEvents: ScheduleEvent[] = [];
    
    // Track new group IDs for source events that didn't have one
    const pendingGroupIds: Record<string, string> = {};

    sourceEvents.forEach(sourceEvent => {
        // Define what makes an event "identical" (Content + Time + Color)
        const signature = (e: ScheduleEvent) => `${e.title}|${e.startMinute}|${e.endMinute}|${e.colorHex}`;
        const srcSig = signature(sourceEvent);

        let groupId = sourceEvent.groupId;

        targetDateStrs.forEach(targetDate => {
             // Check if an identical event exists on the target date
             const existingEvent = updatedEventsList.find(e => 
                e.date === targetDate && 
                signature(e) === srcSig &&
                !eventsToDeleteIds.has(e.id)
             );

             if (existingEvent) {
                 // TOGGLE OFF: Found identical event, delete it
                 eventsToDeleteIds.add(existingEvent.id);
             } else {
                 // TOGGLE ON: No identical event, add copy
                 
                 // If source doesn't have a group ID yet, generate one so they are linked
                 if (!groupId) {
                     if (!pendingGroupIds[sourceEvent.id]) {
                         pendingGroupIds[sourceEvent.id] = generateUUID();
                     }
                     groupId = pendingGroupIds[sourceEvent.id];
                 }

                 newEvents.push({
                    ...sourceEvent,
                    id: generateUUID(), // New unique ID
                    date: targetDate,   // New Date
                    groupId: groupId    // Shared Group ID
                });
             }
        });
    });

    // 1. Filter out deleted events
    updatedEventsList = updatedEventsList.filter(e => !eventsToDeleteIds.has(e.id));

    // 2. Update source events with new group IDs if assigned
    if (Object.keys(pendingGroupIds).length > 0) {
        updatedEventsList = updatedEventsList.map(e => {
            if (pendingGroupIds[e.id]) {
                return { ...e, groupId: pendingGroupIds[e.id] };
            }
            return e;
        });
    }

    // 3. Merge and Save
    const finalEvents = [...updatedEventsList, ...newEvents];
    EventService.saveEvents(finalEvents);
    setEvents(finalEvents);
  };

  const handleUpdateRecurringGroup = (groupId: string, updates: Partial<ScheduleEvent>) => {
    pushToHistory();
    // Update all events with this groupId
    const currentEvents = EventService.getAllEvents();
    const updatedEvents = currentEvents.map(e => {
        if (e.groupId === groupId) {
            return { ...e, ...updates };
        }
        return e;
    });
    EventService.saveEvents(updatedEvents);
    setEvents(updatedEvents);
  };

  const handleDeleteRecurringGroup = (groupId: string) => {
    pushToHistory();
    const updatedEvents = EventService.deleteEventsByGroupId(groupId);
    setEvents(updatedEvents);
  };

  const handleAddEvent = (event: ScheduleEvent) => {
    // We don't necessarily need undo for simple add, but we can add it if desired. 
    // Keeping undo mostly for bulk operations like copy/delete group for now.
    const updatedEvents = EventService.insert(event);
    setEvents(updatedEvents);
  };

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = EventService.deleteEvent(id);
    setEvents(updatedEvents);
  };

  const openAddModal = (startMinute: number, duration: number = 60) => {
    setModalStartMinute(startMinute);
    setModalDuration(duration);
    setIsModalOpen(true);
  };

  // Filter events for the currently selected day to pass to DayView
  const currentDayEvents = events.filter(e => e.date === formatDate(currentDate));

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden font-sans text-gray-900">
      {currentView === 'month' ? (
        <div className="flex-1 overflow-hidden flex flex-col w-full h-full">
          <MonthView 
            currentDate={currentDate}
            events={events}
            onDateSelect={handleDateSelect}
            onCopyEvents={handleCopyEvents}
            onUpdateRecurringGroup={handleUpdateRecurringGroup}
            onDeleteRecurringGroup={handleDeleteRecurringGroup}
            onUndo={handleUndo}
            canUndo={history.length > 0}
          />
        </div>
      ) : (
        <DayView 
          date={currentDate}
          events={currentDayEvents}
          onDeleteEvent={handleDeleteEvent}
          onAddEventRequest={openAddModal}
          onBack={handleBackToMonth}
          onDateSelect={handleDateSelect}
        />
      )}

      <AddEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddEvent}
        initialDate={formatDate(currentDate)}
        initialStartMinute={modalStartMinute}
        initialDuration={modalDuration}
      />
    </div>
  );
}