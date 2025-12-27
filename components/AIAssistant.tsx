import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ScheduleEvent } from '../types';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface AIAssistantProps {
  events: ScheduleEvent[];
  currentDate: Date;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ events, currentDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const analyzeSchedule = async () => {
    if (!process.env.API_KEY) {
        setAnalysis("API Key is missing. Please configure process.env.API_KEY.");
        return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const dayEvents = events.filter(e => e.date === formatDate(currentDate));
      const scheduleText = dayEvents.length === 0 
        ? "No events scheduled for today." 
        : dayEvents.map(e => `- ${e.title}: ${Math.floor(e.startMinute/60)}:${e.startMinute%60} to ${Math.floor(e.endMinute/60)}:${e.endMinute%60}`).join('\n');

      const prompt = `
        You are a helpful personal assistant. Analyze the following schedule for ${currentDate.toDateString()}:
        
        ${scheduleText}
        
        Please provide:
        1. A quick summary of the day's intensity.
        2. Identify any potential conflicts or tight spots (if any).
        3. A motivational quote suitable for the day's workload.
        
        Keep it concise and friendly.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAnalysis(response.text || "Could not generate analysis.");
    } catch (error) {
      console.error(error);
      setAnalysis("Failed to connect to AI assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); analyzeSchedule(); }}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-40 flex items-center gap-2"
      >
        <Sparkles className="w-6 h-6" />
        <span className="font-medium hidden md:inline">Ask AI</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-gray-800">Schedule Assistant</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded-full">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-purple-600" />
                        <p>Analyzing your day...</p>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                            {analysis}
                        </div>
                    </div>
                )}
            </div>
            
            {!loading && (
                <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
                     <button 
                        onClick={analyzeSchedule}
                        className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        Regenerate
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};