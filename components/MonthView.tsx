import React, { useState, useEffect } from 'react';
import { ScheduleEvent } from '../types';
import { formatDate, getDaysInMonth, formatTime } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Copy, Repeat, Edit2, RotateCcw } from 'lucide-react';
import { RecurringEventEditModal } from './RecurringEventEditModal';

interface MonthViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onCopyEvents: (sourceDate: string, targetDates: string[]) => void;
  onUpdateRecurringGroup: (groupId: string, updates: Partial<ScheduleEvent>) => void;
  onDeleteRecurringGroup: (groupId: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  events: ScheduleEvent[];
}

export const MonthView: React.FC<MonthViewProps> = ({ 
  currentDate, 
  onDateSelect, 
  onCopyEvents,
  onUpdateRecurringGroup,
  onDeleteRecurringGroup,
  onUndo,
  canUndo,
  events 
}) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const [isDragging, setIsDragging] = useState(false);
  const [sourceDate, setSourceDate] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  // Recurring Edit State
  const [editingGroupEvent, setEditingGroupEvent] = useState<ScheduleEvent | null>(null);
  const [editingGroupCount, setEditingGroupCount] = useState(0);

  // Group recurring tasks
  const recurringGroups = React.useMemo(() => {
    const groups: Record<string, ScheduleEvent[]> = {};
    events.forEach(e => {
        if (e.groupId) {
            if (!groups[e.groupId]) groups[e.groupId] = [];
            groups[e.groupId].push(e);
        }
    });
    // Only return groups that actually have events
    return Object.values(groups).filter(g => g.length > 0);
  }, [events]);

  // Prevent text selection during drag
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        finishDrag();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, selectedTargets, sourceDate]);

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDayOfWeek = daysInMonth[0].getDay(); 
  const paddingDays = Array(firstDayOfWeek).fill(null);
  const totalCells = paddingDays.length + daysInMonth.length;
  const totalRows = Math.ceil(totalCells / 7);

  const handleDateMouseDown = (e: React.MouseEvent, dateStr: string) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setSourceDate(dateStr);
    setSelectedTargets(new Set());
  };

  const handleDateClick = (dateStr: string) => {
    if (selectedTargets.size > 0) return;
    onDateSelect(new Date(dateStr + "T00:00:00"));
  };

  const handleDateMouseEnter = (dateStr: string) => {
    if (isDragging && sourceDate && dateStr !== sourceDate) {
      const newTargets = new Set(selectedTargets);
      newTargets.add(dateStr);
      setSelectedTargets(newTargets);
    }
  };

  const finishDrag = () => {
    if (isDragging && sourceDate && selectedTargets.size > 0) {
      onCopyEvents(sourceDate, Array.from(selectedTargets));
    }
    setIsDragging(false);
    setSourceDate(null);
    setSelectedTargets(new Set());
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const handleRecurringTaskClick = (group: ScheduleEvent[]) => {
    if (group.length > 0) {
        setEditingGroupEvent(group[0]);
        setEditingGroupCount(group.length);
    }
  };

  const getDayEvents = (dateStr: string) => events.filter(e => e.date === dateStr);

  return (
    <div className="bg-gray-100 select-none h-full flex flex-col w-full relative">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-6 py-4 bg-white shadow-sm z-10">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-1 bg-gray-100 rounded-full p-1">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 flex flex-col min-h-0 w-full px-2 pt-2 pb-4">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {day}
            </div>
            ))}
        </div>

        {/* Days Grid - Apple Style: Rounded Cards, Gaps */}
        <div className={`flex-1 grid grid-cols-7 grid-rows-${Math.max(5, totalRows)} gap-1.5`}>
            {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} />
            ))}

            {daysInMonth.map(day => {
            const dateStr = formatDate(day);
            const isSource = sourceDate === dateStr;
            const isTarget = selectedTargets.has(dateStr);
            const isToday = formatDate(new Date()) === dateStr;
            const dayEvents = getDayEvents(dateStr);

            return (
                <div
                key={dateStr}
                className={`
                    relative rounded-2xl flex flex-col items-center p-1 cursor-pointer transition-all duration-200 border shadow-sm overflow-hidden
                    ${isSource ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-200 z-10 scale-105' : ''}
                    ${isTarget ? 'bg-blue-50 border-blue-300' : ''}
                    ${!isSource && !isTarget ? 'bg-white border-transparent hover:border-gray-200' : ''}
                `}
                onMouseDown={(e) => handleDateMouseDown(e, dateStr)}
                onMouseEnter={() => handleDateMouseEnter(dateStr)}
                onClick={() => handleDateClick(dateStr)}
                >
                    {/* Date Number */}
                    <div className={`
                        text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
                        ${isToday ? 'bg-red-500 text-white shadow-md' : 'text-gray-800'}
                    `}>
                        {day.getDate()}
                    </div>
                    
                    {/* Event Dots/Bars */}
                    <div className="flex-1 w-full flex flex-col gap-0.5 px-0.5">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                            <div key={idx} className="h-1 rounded-full w-full" style={{ backgroundColor: event.colorHex }} />
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="flex justify-center mt-auto">
                                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                            </div>
                        )}
                    </div>

                    {isSource && (
                        <div className="absolute top-0.5 right-0.5">
                            <Copy className="w-2.5 h-2.5 text-blue-600" />
                        </div>
                    )}
                </div>
            );
            })}
        </div>
      </div>

      {/* Undo Button */}
      {canUndo && (
        <button 
            onClick={onUndo}
            className="absolute bottom-6 left-6 z-20 w-12 h-12 bg-white text-gray-800 rounded-full shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
            title="Undo last copy"
        >
            <RotateCcw className="w-6 h-6" />
        </button>
      )}

      {/* Recurring Tasks Module */}
      <div className="h-[30%] bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-800">Recurring Tasks</h3>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{recurringGroups.length} active</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {recurringGroups.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <p className="text-sm">No recurring tasks yet.</p>
                      <p className="text-xs mt-1">Drag across dates to copy a task.</p>
                  </div>
              ) : (
                  recurringGroups.map((group, idx) => {
                      const sample = group[0];
                      const count = group.length;
                      return (
                          <div 
                              key={sample.groupId || idx}
                              onClick={() => handleRecurringTaskClick(group)}
                              className="bg-gray-50 hover:bg-white rounded-xl p-3 border border-transparent hover:border-gray-200 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                          >
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: sample.colorHex }} />
                                  <div className="min-w-0">
                                      <h4 className="font-bold text-gray-800 truncate">{sample.title}</h4>
                                      <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                          <span>{formatTime(sample.startMinute)} - {formatTime(sample.endMinute)}</span>
                                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                          <span className="text-purple-600 font-semibold">{count} days</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="p-2 text-gray-300 group-hover:text-gray-600 transition-colors">
                                  <Edit2 className="w-4 h-4" />
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
      </div>

      <RecurringEventEditModal 
        isOpen={!!editingGroupEvent}
        onClose={() => setEditingGroupEvent(null)}
        onSaveGroup={onUpdateRecurringGroup}
        onDeleteGroup={onDeleteRecurringGroup}
        exampleEvent={editingGroupEvent}
        count={editingGroupCount}
      />
    </div>
  );
};