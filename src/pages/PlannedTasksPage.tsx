import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Check, Calendar as CalendarIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { playSound } from '../utils/sound';

interface Props {
  type: 'weekly' | 'monthly';
  title: string;
}



export const PlannedTasksPage: React.FC<Props> = ({ type, title }) => {
  const { tasks, addTask, toggleTask, deleteTask, themes, activeThemeId } = useApp();
  const [newTaskText, setNewTaskText] = useState('');
  
  // For Monthly: standard date input
  const [monthlyDate, setMonthlyDate] = useState(new Date().toISOString().split('T')[0]);
  
  // For Weekly: selected weekday index (0-5 for rolling window)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];
  
  // Rolling Window: Today + 5 days
  const getRollingWeek = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const rollingDates = getRollingWeek();
  const weekDateStrings = rollingDates.map(d => {
    const offset = d.getTimezoneOffset();
    const date = new Date(d.getTime() - (offset*60*1000));
    return date.toISOString().split('T')[0];
  });

  const getDayLabel = (date: Date, index: number) => {
    if (index === 0) return 'Heute';
    if (index === 1) return 'Morgen';
    return date.toLocaleDateString('de-DE', { weekday: 'long' });
  };

  const filteredTasks = tasks.filter(t => {
    if (type === 'monthly') return t.type === 'monthly';
    
    if (type === 'weekly') {
      const selectedDateString = weekDateStrings[selectedDayIndex];
      
      // Show weekly tasks for the specific date
      if (t.type === 'weekly' && t.dueDate === selectedDateString) return true;
      
      // Show daily tasks ONLY for "Today" (index 0)
      if (t.type === 'daily' && selectedDayIndex === 0) return true;
      
      return false;
    }
    return false;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      const dueDate = type === 'weekly' ? weekDateStrings[selectedDayIndex] : monthlyDate;
      addTask(newTaskText.trim(), type, dueDate);
      setNewTaskText('');
      playSound.click();
    }
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by completion first
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    // Then by due date (relevant for monthly view)
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">{title}</h2>

      {type === 'weekly' && (
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
          {rollingDates.map((date, index) => {
            const isSelected = selectedDayIndex === index;
            const label = getDayLabel(date, index);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDayIndex(index)}
                className={clsx(
                  "px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium",
                  isSelected 
                    ? `text-white shadow-md ${activeTheme.colors.primary}` 
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder={type === 'weekly' ? `Aufgabe für ${getDayLabel(rollingDates[selectedDayIndex], selectedDayIndex)}...` : "Neue Aufgabe..."}
            className="flex-1 p-3 rounded-lg border border-white/40 bg-white/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm placeholder-gray-500"
          />
        </div>
        
        <div className="flex gap-2">
          {type === 'monthly' && (
            <div className="relative flex-1">
               <input
                type="date"
                value={monthlyDate}
                onChange={(e) => setMonthlyDate(e.target.value)}
                className="w-full p-3 rounded-lg border border-white/40 bg-white/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-700"
              />
              <CalendarIcon className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={20} />
            </div>
          )}
          
          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className={clsx(
              "p-3 rounded-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg",
              type === 'monthly' ? "w-16" : "w-full",
              activeTheme.colors.primary
            )}
          >
            <Plus size={24} />
            {type === 'weekly' && <span className="ml-2 font-medium">Hinzufügen</span>}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center">
            <div className="text-center py-4 px-6 text-white bg-black/20 backdrop-blur-sm rounded-lg inline-block mx-auto shadow-sm border border-white/20">
              {type === 'weekly' 
                ? `Keine Aufgaben für ${getDayLabel(rollingDates[selectedDayIndex], selectedDayIndex)}.` 
                : "Keine Aufgaben geplant."}
            </div>
          </div>
        ) : (
          sortedTasks.map(task => (
            <div
              key={task.id}
              className={clsx(
                "flex flex-col gap-2 p-4 rounded-lg border shadow-sm transition-all duration-500 ease-in-out transform",
                task.completed 
                  ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75 scale-95" 
                  : "bg-white border-gray-200 scale-100"
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={clsx(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    task.completed
                      ? `border-transparent text-white scale-110 ${activeTheme.colors.primary}`
                      : "border-gray-400 hover:border-gray-600 hover:scale-105"
                  )}
                >
                  {task.completed && <Check size={14} strokeWidth={3} />}
                </button>
                
                <span className={clsx(
                  "flex-1 break-words font-medium",
                  task.completed && "line-through text-gray-500"
                )}>
                  {task.text}
                </span>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              {task.dueDate && type !== 'weekly' && (
                <div className="flex items-center gap-2 text-xs text-gray-500 ml-9">
                  <CalendarIcon size={12} />
                  <span>
                    {`Fällig am: ${new Date(task.dueDate).toLocaleDateString('de-DE')}`}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
