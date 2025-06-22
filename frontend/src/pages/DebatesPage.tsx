import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDebateSessions } from '../services/debateService';
import { 
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Card } from '../components/Card';
import { SearchBar } from '../components/SearchBar';
import { StatusBadge } from '../components/Badge';
import toast from 'react-hot-toast';

interface Topic {
  id: number;
  title: string;
  description: string;
  created_at?: string;
}

interface Session {
  id: number;
  topic: Topic;
  moderator: {
    id: number;
    username: string;
  };
  start_time: string;
  end_time?: string;
  participant_count: number;
  status: 'active' | 'scheduled' | 'completed';
}

const DebatesPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'completed'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionsResponse = await getDebateSessions();
        setSessions(sessionsResponse);
        setFilteredSessions(sessionsResponse);
      } catch (error) {
        console.error("Failed to fetch debates", error);
        toast.error('Failed to load debates');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter sessions based on search query and status
  useEffect(() => {
    let filtered = sessions;

    if (searchQuery.trim()) {
      filtered = filtered.filter(session =>
        session.topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.topic.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    setFilteredSessions(filtered);
  }, [searchQuery, statusFilter, sessions]);

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
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-gray-900 dark:text-white mb-4">
          All Debates
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Join ongoing debates or explore completed discussions
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Search debates by topic..."
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={setSearchQuery}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'scheduled', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      <div className="grid gap-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No debates found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters to find debates.
              </p>
            </div>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {session.topic.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Moderated by {session.moderator.username}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                      {session.topic.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>{session.participant_count || 0} participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{new Date(session.start_time).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    <StatusBadge 
                      status={session.status === 'active' ? 'online' : 'offline'}
                      showText={true}
                    />
                    <RouterLink
                      to={`/debates/${session.id}`}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      <EyeIcon className="w-4 h-4" />
                      {session.status === 'active' ? 'Join' : 'View'}
                    </RouterLink>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebatesPage;
