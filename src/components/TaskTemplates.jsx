import { useState, useEffect } from 'react';
import { Layers, Plus, X, Play, Trash2, CheckSquare } from 'lucide-react';
import { taskTemplatesAPI, tasksAPI } from '../utils/api';

function TaskTemplates({ familyMembers, tasks, setTasks }) {
  const [templates, setTemplates] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await taskTemplatesAPI.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();

    if (selectedTasks.length === 0) {
      alert('Please select at least one task');
      return;
    }

    const taskData = selectedTasks.map(taskId => {
      const task = tasks.find(t => t.id === taskId);
      return {
        title: task.title,
        description: task.description,
        points: task.points,
        duration: task.duration,
        category: task.category,
        difficulty: task.difficulty,
        deadline: task.deadline,
        deadline_type: task.deadline_type
      };
    });

    const template = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: templateName,
      description: templateDescription,
      tasks: taskData,
      created_by: null,
      is_system: false
    };

    try {
      await taskTemplatesAPI.create(template);
      setTemplates([...templates, template]);
      setTemplateName('');
      setTemplateDescription('');
      setSelectedTasks([]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template. Please try again.');
    }
  };

  const handleDeployTemplate = async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Ask which family member to assign to
    const memberSelection = window.prompt(
      `Deploy "${template.name}" to:\n\n` +
      familyMembers.map((m, i) => `${i + 1}. ${m.name}`).join('\n') +
      '\n\nEnter number (or leave blank for unassigned):'
    );

    let assignedTo = null;
    if (memberSelection && memberSelection.trim()) {
      const index = parseInt(memberSelection) - 1;
      if (index >= 0 && index < familyMembers.length) {
        assignedTo = familyMembers[index].id;
      }
    }

    try {
      const result = await taskTemplatesAPI.deploy(templateId, assignedTo, null);

      // Reload tasks
      const allTasks = await tasksAPI.getAll();
      setTasks(allTasks);

      alert(`Successfully created ${result.tasks.length} tasks from template "${template.name}"!`);
    } catch (error) {
      console.error('Failed to deploy template:', error);
      alert('Failed to deploy template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      await taskTemplatesAPI.delete(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const toggleTaskSelection = (taskId) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  // Get available tasks (not completed)
  const availableTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Layers className="text-purple-500" />
          Task Templates
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Create Template
        </button>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="bg-purple-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Template</h3>

          <form onSubmit={handleCreateTemplate}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Template Name</label>
              <input
                type="text"
                required
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Morning Routine, Weekend Chores"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="2"
                placeholder="Describe what this template is for"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Tasks ({selectedTasks.length} selected)
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                {availableTasks.length === 0 ? (
                  <p className="text-gray-500 text-sm p-4 text-center">
                    No available tasks. Create some tasks first!
                  </p>
                ) : (
                  availableTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedTasks.includes(task.id)
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare
                          size={20}
                          className={selectedTasks.includes(task.id) ? 'text-purple-600' : 'text-gray-400'}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{task.title}</p>
                          <p className="text-xs text-gray-600">
                            {task.category} • {task.points} points
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700"
                disabled={selectedTasks.length === 0}
              >
                Create Template
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedTasks([]);
                  setTemplateName('');
                  setTemplateDescription('');
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <Layers size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Layers size={64} className="mx-auto mb-4 opacity-50" />
          <p>No templates yet. Create your first template!</p>
          <p className="text-sm mt-2">Templates let you quickly deploy multiple tasks at once.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map(template => (
            <div key={template.id} className="border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    {template.name}
                    {template.is_system && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                        System
                      </span>
                    )}
                  </h3>
                  {template.description && (
                    <p className="text-gray-600 text-sm mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeployTemplate(template.id)}
                    className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm font-semibold"
                    title="Deploy template"
                  >
                    <Play size={16} />
                    Deploy
                  </button>
                  {!template.is_system && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                      title="Delete template"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Tasks in template ({template.tasks.length}):
                </p>
                <div className="space-y-1">
                  {template.tasks.map((task, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-purple-600 font-semibold">•</span>
                      <span className="flex-1">{task.title}</span>
                      <span className="text-purple-600 font-semibold">{task.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskTemplates;
