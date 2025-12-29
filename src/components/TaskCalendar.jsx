import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Trophy, Star } from 'lucide-react';
import { taskHistoryAPI } from '../utils/api';

function TaskCalendar({ familyMembers }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (familyMembers.length > 0 && !selectedMember) {
      setSelectedMember(familyMembers[0].id);
    }
  }, [familyMembers]);

  useEffect(() => {
    if (selectedMember) {
      loadHistory();
    }
  }, [selectedMember, currentDate, viewMode]);

  const loadHistory = async () => {
    if (!selectedMember) return;

    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      const data = await taskHistoryAPI.get(selectedMember, startDate, endDate);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load task history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'month') {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      return { startDate, endDate };
    } else {
      // Week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0]
      };
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return history.filter(h => h.completed_at.startsWith(dateStr));
  };

  const getPointsForDate = (date) => {
    const tasks = getTasksForDate(date);
    return tasks.reduce((sum, task) => sum + task.points_earned, 0);
  };

  const getColorForPoints = (points) => {
    if (points === 0) return 'bg-gray-100';
    if (points < 20) return 'bg-green-200';
    if (points < 50) return 'bg-blue-300';
    if (points < 100) return 'bg-purple-400';
    return 'bg-yellow-400';
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const totalPointsThisMonth = history.reduce((sum, h) => sum + h.points_earned, 0);
  const totalTasksThisMonth = history.length;

  if (familyMembers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No family members yet</h2>
        <p className="text-gray-500">Add family members to view their task calendar!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-500" />
          Task Calendar
        </h2>
      </div>

      {/* Member selector and view toggle */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Family Member</label>
          <select
            value={selectedMember || ''}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-blue-600" size={20} />
            <span className="text-sm font-semibold text-gray-700">Total Points</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{totalPointsThisMonth}</div>
          <div className="text-xs text-gray-600">this {viewMode}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="text-green-600" size={20} />
            <span className="text-sm font-semibold text-gray-700">Tasks Completed</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{totalTasksThisMonth}</div>
          <div className="text-xs text-gray-600">this {viewMode}</div>
        </div>
      </div>

      {/* Calendar navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={viewMode === 'month' ? handlePreviousMonth : handlePreviousWeek}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-xl font-bold text-gray-800">{monthName}</h3>
        <button
          onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Loading calendar...</p>
        </div>
      ) : (
        <div className="mb-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              const points = date ? getPointsForDate(date) : 0;
              const tasksCount = date ? getTasksForDate(date).length : 0;
              const isToday = date && date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();

              return (
                <div
                  key={index}
                  onClick={() => date && handleDateClick(date)}
                  className={`aspect-square p-2 rounded-lg cursor-pointer transition-all ${
                    !date
                      ? 'bg-transparent cursor-default'
                      : isSelected
                      ? 'ring-2 ring-blue-500'
                      : 'hover:ring-2 hover:ring-gray-300'
                  } ${date ? getColorForPoints(points) : ''} ${
                    isToday ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  {date && (
                    <div className="h-full flex flex-col justify-between">
                      <div className="text-sm font-semibold text-gray-800">
                        {date.getDate()}
                      </div>
                      {tasksCount > 0 && (
                        <div className="text-center">
                          <div className="text-xs font-bold text-gray-800">{tasksCount}</div>
                          <div className="text-xs text-gray-600">{points}pt</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Color legend */}
      <div className="flex gap-4 mb-6 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span className="text-gray-600">0 points</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 rounded"></div>
          <span className="text-gray-600">1-19 pts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300 rounded"></div>
          <span className="text-gray-600">20-49 pts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-400 rounded"></div>
          <span className="text-gray-600">50-99 pts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span className="text-gray-600">100+ pts</span>
        </div>
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <h4 className="font-bold text-gray-800 mb-3">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
          {selectedDateTasks.length === 0 ? (
            <p className="text-gray-600 text-sm">No tasks completed on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDateTasks.map(task => (
                <div key={task.id} className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{task.task_title}</p>
                      {task.category && (
                        <p className="text-xs text-gray-500">{task.category}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">+{task.points_earned} pts</p>
                      <p className="text-xs text-gray-500">
                        {new Date(task.completed_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Total for this day:</span>
                  <span className="text-purple-600">
                    {selectedDateTasks.reduce((sum, t) => sum + t.points_earned, 0)} points
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskCalendar;
