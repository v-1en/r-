import React, { useState, useEffect } from 'react';
import { COLORS, ScheduleEvent } from '../types';
import { formatTime } from '../utils/dateUtils';
import { X, Save, Repeat } from 'lucide-react';

interface RecurringEventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGroup: (groupId: string, updates: Partial<ScheduleEvent>) => void;
  onDeleteGroup: (groupId: string) => void;
  exampleEvent: ScheduleEvent | null;
  count: number;
}

export const RecurringEventEditModal: React.FC<RecurringEventEditModalProps> = ({
  isOpen,
  onClose,
  onSaveGroup,
  exampleEvent,
  count
}) => {
  const [title, setTitle] = useState('');
  const [startMinute, setStartMinute] = useState(0);
  const [endMinute, setEndMinute] = useState(60);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  useEffect(() => {
    if (isOpen && exampleEvent) {
      setTitle(exampleEvent.title);
      setStartMinute(exampleEvent.startMinute);
      setEndMinute(exampleEvent.endMinute);
      setSelectedColor(exampleEvent.colorHex);
    }
  }, [isOpen, exampleEvent]);

  if (!isOpen || !exampleEvent) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (exampleEvent.groupId) {
      onSaveGroup(exampleEvent.groupId, {
        title,
        startMinute,
        endMinute,
        colorHex: selectedColor
      });
      onClose();
    }
  };

  const startTimeStr = formatTime(startMinute);
  const endTimeStr = formatTime(endMinute);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2 text-purple-600">
                <Repeat className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wide">Recurring Task</span>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>

        <div className="p-6">
            <div className="mb-6 text-center">
                <p className="text-gray-500 text-sm">Editing <span className="font-bold text-gray-800">{count}</span> instances across your calendar.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-lg font-bold border-b-2 border-gray-200 focus:border-purple-500 outline-none py-1 bg-transparent transition-colors text-gray-800"
                        placeholder="Task Name"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start</label>
                        <input 
                            type="time" 
                            value={startTimeStr}
                            onChange={(e) => {
                                const [h, m] = e.target.value.split(':').map(Number);
                                const newStart = h * 60 + m;
                                setStartMinute(newStart);
                                if (newStart >= endMinute) setEndMinute(newStart + 60);
                            }}
                            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-purple-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End</label>
                         <input 
                            type="time" 
                            value={endTimeStr}
                            onChange={(e) => {
                                const [h, m] = e.target.value.split(':').map(Number);
                                setEndMinute(h * 60 + m);
                            }}
                            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-purple-200"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Color</label>
                    <div className="flex gap-2 flex-wrap justify-center">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedColor(color)}
                                className={`w-8 h-8 rounded-full transition-all duration-200 ${selectedColor === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-300 shadow-lg' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Save className="w-5 h-5" />
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};