import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon,
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import toast from 'react-hot-toast';
import api from '../services/api';
import { 
  createDebateTopic, 
  deleteDebateTopic,
  createDebateSession,
  deleteDebateSession
} from '../services/debateService';

interface DebateTopic {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface DebateSession {
  id: number;
  topic: DebateTopic;
  moderator: {
    id: number;
    username: string;
  };
  start_time: string;
  end_time?: string;
  participant_count: number;
  status: 'active' | 'scheduled' | 'completed';
}

interface CreateTopicForm {
  title: string;
  description: string;
}

interface CreateSessionForm {
  topic_id: number;
  start_time?: string;
  end_time?: string;
}

const ModeratorDashboard = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: _user } = useAuth(); // Keep for auth context
  const [topics, setTopics] = useState<DebateTopic[]>([]);
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showViewTopicModal, setShowViewTopicModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null);
  
  const [createTopicForm, setCreateTopicForm] = useState<CreateTopicForm>({
    title: '',
    description: ''
  });
    const [createSessionForm, setCreateSessionForm] = useState<CreateSessionForm>({
    topic_id: 0,
    start_time: '',
    end_time: ''
  });
  const fetchData = async () => {
    try {
      setLoading(true);
      const [topicsResponse, sessionsResponse] = await Promise.all([
        api.get('/debates/topics/'),
        api.get('/debates/sessions/')
      ]);
      setTopics(topicsResponse.data);
      setSessions(sessionsResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  const handleViewTopic = (topic: DebateTopic) => {
    setSelectedTopic(topic);
    setShowViewTopicModal(true);
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createDebateTopic(createTopicForm);
      setTopics([...topics, response]);
      setCreateTopicForm({ title: '', description: '' });
      setShowCreateTopicModal(false);
      toast.success('Topic created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create topic');
    }
  };  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that a topic is selected
    if (createSessionForm.topic_id === 0) {
      toast.error('Please select a topic for the debate session');
      return;
    }
    
    try {
      const sessionData = {
        topic_id: createSessionForm.topic_id,
        ...(createSessionForm.start_time && { 
          start_time: new Date(createSessionForm.start_time).toISOString() 
        }),
        ...(createSessionForm.end_time && { 
          end_time: new Date(createSessionForm.end_time).toISOString() 
        })
      };
      
      const response = await createDebateSession(sessionData);
      setSessions([...sessions, response]);
      setCreateSessionForm({ topic_id: 0, start_time: '', end_time: '' });
      setShowCreateSessionModal(false);
      toast.success('Debate session created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create session');
    }
  };const handleDeleteTopic = async (topicId: number) => {
    // We'll use a toast confirmation instead of window.confirm
    const confirmDelete = await new Promise((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <div className="font-medium">Delete Topic</div>
          <div>Are you sure you want to delete this topic? All associated sessions will also be deleted.</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm"
            >
              Delete
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ), { duration: 0 });
    });

    if (!confirmDelete) {
      return;
    }
    
    try {
      await deleteDebateTopic(topicId);
      setTopics(topics.filter(t => t.id !== topicId));
      toast.success('Topic deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete topic');
    }
  };
  const handleDeleteSession = async (sessionId: number) => {
    // We'll use a toast confirmation instead of window.confirm
    const confirmDelete = await new Promise((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <div className="font-medium">Delete Session</div>
          <div>Are you sure you want to delete this session?</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm"
            >
              Delete
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ), { duration: 0 });
    });

    if (!confirmDelete) {
      return;
    }
    
    try {
      await deleteDebateSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Session deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
            Moderator Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage debate topics and sessions
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            onClick={() => setShowCreateTopicModal(true)}
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="w-5 h-5" />
            New Topic
          </motion.button>
          <motion.button
            onClick={() => setShowCreateSessionModal(true)}
            className="btn-secondary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            New Session
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Topics</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{topics.length}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sessions.filter(s => s.status === 'active').length}
              </p>
            </div>
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Participants</p>              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sessions.reduce((total, session) => total + (session.participant_count || 0), 0)}
              </p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Topics Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Debate Topics</h2>
          <button
            onClick={() => setShowCreateTopicModal(true)}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {topics.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No topics created yet</p>
            </div>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{topic.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{topic.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Created {new Date(topic.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">                    <button
                      onClick={() => handleViewTopic(topic)}
                      className="p-2 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Sessions Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Debate Sessions</h2>
          <button
            onClick={() => setShowCreateSessionModal(true)}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No sessions created yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{session.topic.title}</h3>
                      <StatusBadge 
                        status={session.status === 'active' ? 'online' : session.status === 'completed' ? 'offline' : 'away'} 
                        showText={true}
                      />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{session.topic.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span>Started: {new Date(session.start_time).toLocaleString()}</span>
                      {session.end_time && (
                        <span>Ended: {new Date(session.end_time).toLocaleString()}</span>
                      )}
                      <span>{session.participant_count || 0} participants</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <a
                      href={`/debates/${session.id}`}
                      className="p-2 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* View Topic Modal */}
      <AnimatePresence>
        {showViewTopicModal && selectedTopic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Topic Details</h3>
                <button
                  onClick={() => setShowViewTopicModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {selectedTopic.title}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedTopic.description}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Created At
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {new Date(selectedTopic.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Associated Sessions
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {sessions.filter(session => session.topic.id === selectedTopic.id).length > 0 ? (
                      <div className="space-y-2">
                        {sessions
                          .filter(session => session.topic.id === selectedTopic.id)
                          .map(session => (
                            <div key={session.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                              <span className="text-sm text-gray-900 dark:text-white">
                                Session #{session.id}
                              </span>                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                session.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                session.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {session.status}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        No sessions created for this topic yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowViewTopicModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Topic Modal */}
      <AnimatePresence>
        {showCreateTopicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Topic</h3>
              <form onSubmit={handleCreateTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={createTopicForm.title}
                    onChange={(e) => setCreateTopicForm({ ...createTopicForm, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createTopicForm.description}
                    onChange={(e) => setCreateTopicForm({ ...createTopicForm, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateTopicModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreateSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Session</h3>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Topic
                  </label>
                  <select
                    value={createSessionForm.topic_id}
                    onChange={(e) => setCreateSessionForm({ ...createSessionForm, topic_id: parseInt(e.target.value) })}
                    className="input-field"
                    required
                  >
                    <option value="">Select a topic</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                </div>                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={createSessionForm.start_time}
                    onChange={(e) => setCreateSessionForm({ ...createSessionForm, start_time: e.target.value })}
                    className="input-field"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={createSessionForm.end_time}
                    onChange={(e) => setCreateSessionForm({ ...createSessionForm, end_time: e.target.value })}
                    className="input-field"
                    min={createSessionForm.start_time || new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateSessionModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModeratorDashboard;
