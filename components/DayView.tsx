import React, { useRef, useEffect, useMemo, useState } from 'react';
import { ScheduleEvent } from '../types';
import { formatTime, formatDate } from '../utils/dateUtils';
import { Trash2, ArrowLeft, Plus } from 'lucide-react';

interface DayViewProps {
  date: Date;
  events: ScheduleEvent[];
  onDeleteEvent: (id: string) => void;
  onAddEventRequest: (startMinute: number, duration?: number) => void;
  onBack: () => void;
  onDateSelect: (date: Date) => void;
}

export const DayView: React.FC<DayViewProps> = ({ 
  date, 
  events, 
  onDeleteEvent, 
  onAddEventRequest, 
  onBack,
  onDateSelect
}) => {
  const dateStripRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Drag Selection State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartMinute, setDragStartMinute] = useState<number | null>(null);
  const [dragCurrentMinute, setDragCurrentMinute] = useState<number | null>(null);

  // Generate a range of dates around the selected date
  const dateRange = useMemo(() => {
    const days = [];
    for (let i = -15; i <= 15; i++) {
      const d = new Date(date);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [date]);

  // Auto-center the selected date in the strip using scrollTo to avoid scrolling the parent
  useEffect(() => {
    if (dateStripRef.current) {
      const selectedEl = dateStripRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (selectedEl) {
        const container = dateStripRef.current;
        const scrollLeft = selectedEl.offsetLeft - (container.clientWidth / 2) + (selectedEl.clientWidth / 2);
        
        container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
      }
    }
  }, [date]);

  // Timeline Interactions
  const handleTimelineStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    
    const x = clientX - rect.left;
    const totalWidth = rect.width;
    const minute = Math.floor((x / totalWidth) * 1440);
    
    setIsDragging(true);
    setDragStartMinute(Math.max(0, Math.min(1439, minute)));
    setDragCurrentMinute(Math.max(0, Math.min(1439, minute)));
  };

  const handleTimelineMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const x = clientX - rect.left;
    const totalWidth = rect.width;
    const minute = Math.floor((x / totalWidth) * 1440);
    
    setDragCurrentMinute(Math.max(0, Math.min(1439, minute)));
  };

  const handleTimelineEnd = () => {
    if (isDragging && dragStartMinute !== null && dragCurrentMinute !== null) {
      const start = Math.min(dragStartMinute, dragCurrentMinute);
      const end = Math.max(dragStartMinute, dragCurrentMinute);
      const duration = Math.max(15, end - start);
      onAddEventRequest(start, duration);
    }
    setIsDragging(false);
    setDragStartMinute(null);
    setDragCurrentMinute(null);
  };

  const handleFabClick = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let startMinute = Math.ceil(currentMinutes / 30) * 30;
    if (startMinute >= 23 * 60) startMinute = 8 * 60; 
    onAddEventRequest(startMinute, 60);
  };

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => a.startMinute - b.startMinute);

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-50 relative w-full overflow-hidden">
        {/* Header with Back Button */}
        <div className="flex-none flex items-center px-4 py-4 bg-white z-30 border-b border-gray-100">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full text-black transition-colors mr-3 active:bg-gray-200"
                aria-label="Back"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
                {date.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </h2>
        </div>

        {/* Date Strip - Carousel */}
        <div className="flex-none py-4 bg-white z-20 shadow-sm">
            <div 
                ref={dateStripRef}
                className="flex overflow-x-auto no-scrollbar px-[40%] w-full"
                style={{ scrollPaddingLeft: '0px' }} 
            >
                {dateRange.map((d, index) => {
                    const isSelected = d.toDateString() === date.toDateString();
                    const isToday = d.toDateString() === new Date().toDateString();
                    
                    return (
                        <button
                            key={index}
                            data-selected={isSelected}
                            onClick={() => onDateSelect(d)}
                            className={`
                                flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 mx-1.5 rounded-2xl transition-all duration-200 border
                                ${isSelected 
                                    ? 'bg-black text-white border-black shadow-lg scale-110' 
                                    : 'bg-white text-gray-400 border-gray-100'
                                }
                            `}
                        >
                            <span className={`text-[10px] font-bold uppercase mb-0.5 ${isSelected ? 'text-gray-300' : ''}`}>
                                {d.toLocaleDateString('default', { weekday: 'short' })}
                            </span>
                            <span className="text-lg font-bold leading-none">
                                {d.getDate()}
                            </span>
                            {isToday && (
                                <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-red-500' : 'bg-red-500'}`}></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Horizontal Timeline Axis */}
        <div className="flex-none mt-4 px-4 w-full">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Timeline</div>
            <div 
                ref={timelineRef}
                className="relative h-24 bg-white rounded-2xl shadow-sm border border-gray-200 w-full overflow-hidden cursor-crosshair select-none touch-none"
                onMouseDown={handleTimelineStart}
                onMouseMove={handleTimelineMove}
                onMouseUp={handleTimelineEnd}
                onMouseLeave={handleTimelineEnd}
                onTouchStart={handleTimelineStart}
                onTouchMove={handleTimelineMove}
                onTouchEnd={handleTimelineEnd}
            >
                 <div className="h-full relative w-full">
                    {/* Time Ticks */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className="absolute bottom-0 top-0 border-l border-gray-100" style={{ left: `${(i / 24) * 100}%` }}>
                                {/* Show label every 2 hours to avoid crowding on small screens. Skip 0 and 24 to avoid edge clipping. */}
                                {i % 2 === 0 && i !== 0 && i !== 24 && (
                                    <span className="absolute bottom-1 -left-2 text-[10px] text-gray-400 font-medium w-4 text-center">
                                        {i}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Middle Axis Line */}
                    <div className="absolute top-1/2 left-0 w-full h-px bg-red-500/10 transform -translate-y-1/2 pointer-events-none"></div>

                    {/* Existing Events Visualization (Discrete Lines) */}
                    {events.map(event => {
                        const startPct = (event.startMinute / 1440) * 100;
                        const widthPct = ((event.endMinute - event.startMinute) / 1440) * 100;
                        return (
                            <div
                                key={event.id}
                                className="absolute top-2 bottom-7 rounded-sm overflow-hidden pointer-events-none"
                                style={{
                                    left: `${startPct}%`,
                                    width: `${widthPct}%`,
                                }}
                            >
                                <div 
                                    className="w-full h-full opacity-80"
                                    style={{
                                        backgroundColor: event.colorHex,
                                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.7) 1px, rgba(255,255,255,0.7) 3px)`
                                    }}
                                />
                            </div>
                        );
                    })}

                    {/* Drag Selection Highlight */}
                    {isDragging && dragStartMinute !== null && dragCurrentMinute !== null && (
                        <div
                            className="absolute top-0 bottom-0 bg-blue-500/20 border-x-2 border-blue-500 z-10 pointer-events-none"
                            style={{
                                left: `${(Math.min(dragStartMinute, dragCurrentMinute) / 1440) * 100}%`,
                                width: `${(Math.abs(dragCurrentMinute - dragStartMinute) / 1440) * 100}%`,
                            }}
                        />
                    )}
                 </div>
            </div>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto px-4 pb-24 mt-4 w-full">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Events</div>
             <div className="space-y-3">
                {sortedEvents.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p>No events today</p>
                    </div>
                ) : (
                    sortedEvents.map(event => (
                        <div 
                            key={event.id}
                            className="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.99] transition-transform w-full"
                        >
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: event.colorHex }}></div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-800 text-lg truncate">{event.title}</h3>
                                    <div className="text-sm text-gray-500 font-medium truncate">
                                        {formatTime(event.startMinute)} - {formatTime(event.endMinute)}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => onDeleteEvent(event.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
             </div>
        </div>

        {/* FAB */}
        <button
            onClick={handleFabClick}
            className="absolute bottom-8 right-8 w-14 h-14 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 active:scale-90 transition-all flex items-center justify-center z-30"
            aria-label="Add Event"
        >
            <Plus className="w-7 h-7" />
        </button>
    </div>
  );
};