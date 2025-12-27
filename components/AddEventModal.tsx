import React, { useState } from 'react';
import { COLORS, ScheduleEvent } from '../types';
import { generateUUID, formatTime } from '../utils/dateUtils';
import { X } from 'lucide-react';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void;
  initialDate: string;
  initialStartMinute: number;
  initialDuration?: number;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialDate, 
    initialStartMinute, 
    initialDuration = 60 
}) => {
  const [title, setTitle] = useState('');
  const [startMinute, setStartMinute] = useState(initialStartMinute);
  const [endMinute, setEndMinute] = useState(initialStartMinute + initialDuration);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
        setTitle('');
        setStartMinute(initialStartMinute);
        setEndMinute(initialStartMinute + (initialDuration || 60));
    }
  }, [isOpen, initialStartMinute, initialDuration]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: ScheduleEvent = {
      id: generateUUID(),
      title: title || 'New Event',
      date: initialDate,
      startMinute,
      endMinute: Math.max(startMinute + 15, endMinute), // Ensure at least 15 mins positive duration
      colorHex: selectedColor,
    };
    onSave(newEvent);
    onClose();
  };

  const startTimeStr = formatTime(startMinute);
  const endTimeStr = formatTime(endMinute);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Add Event</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-3 focus:border-blue-500 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Event Name"
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start</label>
                    <input 
                        type="time" 
                        value={startTimeStr}
                        onChange={(e) => {
                            const [h, m] = e.target.value.split(':').map(Number);
                            const newStart = h * 60 + m;
                            setStartMinute(newStart);
                            if (newStart >= endMinute) {
                                setEndMinute(newStart + 60);
                            }
                        }}
                        className="w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-3 focus:ring-blue-500 outline-none"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">End</label>
                     <input 
                        type="time" 
                        value={endTimeStr}
                        onChange={(e) => {
                            const [h, m] = e.target.value.split(':').map(Number);
                            setEndMinute(h * 60 + m);
                        }}
                        className="w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-3 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Color Tag</label>
                <div className="flex gap-3 flex-wrap justify-between">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`w-9 h-9 rounded-full transition-transform ${selectedColor === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400 shadow-md' : 'hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            <div className="pt-2">
                <button type="submit" className="w-full bg-black text-white py-3.5 rounded-xl hover:bg-gray-800 font-bold text-lg transition-colors shadow-lg">
                    Done
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};