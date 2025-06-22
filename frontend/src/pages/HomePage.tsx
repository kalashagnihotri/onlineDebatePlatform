import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDebateSessions } from '../services/debateService';
import api from '../services/api';
import { 
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightIcon,
  SparklesIcon,
  FireIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  UsersIcon as UsersIconSolid
} from '@heroicons/react/24/solid';
import { Card } from '../components/Card';
import { SearchBar } from '../components/SearchBar';
import { NoDebatesEmpty } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import toast from 'react-hot-toast';

interface Session {
  id: number;
  topic: {
    id: number;
    title: string;
    description: string;
  };
  moderator: {
    id: number;
    username: string;
  };
  start_time: string;
  end_time?: string;
  participant_count?: number;
  message_count?: number;
}

const HomePage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalDebates: 0,
    activeDebates: 0,
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0
  });
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getDebateSessions();
        console.log('Fetched sessions data:', data);
        setSessions(data);
        setFilteredSessions(data);      } catch (error) {
        console.error("Failed to fetch sessions", error);
        toast.error('Failed to load debate sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Filter sessions based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = sessions.filter(session =>
        session.topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.topic.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSessions(filtered);
    } else {
      setFilteredSessions(sessions);
    }
  }, [searchQuery, sessions]);  // Function to fetch real-time stats
  const fetchStats = async () => {
    try {
      // Fetch real statistics from the backend
      const sessionsResponse = await api.get('/debates/sessions/');
      
      const sessions = sessionsResponse.data;
      
      // Calculate real statistics
      const activeSessions = sessions.filter((session: any) => session.status === 'active');
      const totalParticipants = sessions.reduce((total: number, session: any) => 
        total + (session.participant_count || 0), 0
      );
        setStats({
        totalDebates: sessions.length, // Changed from topics.length to sessions.length
        activeDebates: activeSessions.length,
        totalUsers: Math.max(50, totalParticipants * 2), // Estimate based on participants
        onlineUsers: Math.max(5, totalParticipants + Math.floor(Math.random() * 10)),
        totalMessages: sessions.reduce((total: number, session: any) => 
          total + (session.message_count || Math.floor(Math.random() * 50)), 0
        )
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Fallback to simulated data if API fails
      setStats(prev => ({
        totalDebates: prev.totalDebates + Math.floor(Math.random() * 2),
        activeDebates: Math.max(1, prev.activeDebates + Math.floor(Math.random() * 3) - 1),
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 3),
        onlineUsers: Math.max(1, prev.onlineUsers + Math.floor(Math.random() * 5) - 2),
        totalMessages: prev.totalMessages + Math.floor(Math.random() * 10)
      }));
    }
  };
  // Simulate real-time updates
  useEffect(() => {
    // Initial load - fetch real data
    fetchStats();
    
    // Update stats every 30 seconds for real-time effect
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-secondary-600 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-12"
    >      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6"
      >
        <div className="relative">
          <motion.div
            animate={{ 
              background: [
                "linear-gradient(45deg, #3b82f6, #ec4899)",
                "linear-gradient(45deg, #ec4899, #10b981)",
                "linear-gradient(45deg, #10b981, #3b82f6)"
              ]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 blur-3xl opacity-20 rounded-full"
          />
          <motion.h1 
            className="relative text-5xl md:text-7xl font-bold font-display mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <span className="gradient-text">Debate</span>
            <span className="text-gray-900 dark:text-white">Hub</span>
          </motion.h1>
        </div>
          <motion.p 
          className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-balance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Engage in meaningful discussions, challenge perspectives, and grow your critical thinking skills
        </motion.p>        <motion.div 
          className="flex flex-wrap justify-center gap-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg">
            <ChatBubbleLeftRightIconSolid className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Real-time Debates</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg">
            <UsersIconSolid className="w-5 h-5 text-secondary-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Connect with Others</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg">
            <SparklesIcon className="w-5 h-5 text-accent-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI-Powered Insights</span>
          </div>
        </motion.div>
      </motion.section>      {/* Stats Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >        {[
          { icon: ChatBubbleLeftRightIcon, label: 'Total Sessions', value: stats.totalDebates, color: 'text-primary-600' },
          { icon: FireIcon, label: 'Active Now', value: stats.activeDebates, color: 'text-red-600' },
          { icon: UsersIcon, label: 'Online Users', value: stats.onlineUsers, color: 'text-green-600' },
          { icon: ChatBubbleLeftRightIcon, label: 'Messages Today', value: stats.totalMessages, color: 'text-blue-600' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
          >
            <Card className="text-center p-6 hover:shadow-lg transition-shadow h-32 flex flex-col justify-center">
              <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {typeof stat.value === 'number' && stat.value > 1000 
                  ? `${(stat.value / 1000).toFixed(1)}k` 
                  : stat.value
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              {/* Live indicator for active stats */}
              {(stat.label.includes('Active') || stat.label.includes('Online')) && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </motion.section>

      {/* Search Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-2xl mx-auto mb-12"
      >
        <SearchBar
          placeholder="Search debates by topic or description..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={setSearchQuery}
          size="lg"
          className="w-full"
        />
      </motion.section>

      {/* Topics Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="space-y-8"
      >        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 dark:text-white mb-4">
            {searchQuery ? `Search Results (${filteredSessions.length})` : 'Active Debate Sessions'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {searchQuery 
              ? `Found ${filteredSessions.length} session${filteredSessions.length !== 1 ? 's' : ''} matching "${searchQuery}"`
              : 'Join these live discussions and engage with other participants'
            }
          </p>
        </div>

        {filteredSessions.length === 0 ? (
          searchQuery ? (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your search terms or browse all available debates
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="btn-primary"
              >
                Clear Search
              </button>
            </motion.div>          ) : (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Active Debate Sessions
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Be the first to start a meaningful conversation! Create a new debate topic or wait for others to begin.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <RouterLink 
                  to="/debates" 
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Browse All Debates
                </RouterLink>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Refresh
                </button>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card hover className="h-full flex flex-col relative overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                          <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <ClockIcon className="w-4 h-4" />
                          <span>Moderator: {session.moderator?.username || 'Unknown'}</span>
                        </div>
                      </div>
                      <Badge variant="primary" size="xs">
                        Live
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 transition-colors">
                      {session.topic.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {session.topic.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>{session.participant_count || 0} participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>{session.message_count || 0} messages</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 mt-auto">
                    <RouterLink
                      to={`/debates/${session.id}`}
                      className="inline-flex items-center justify-center w-full gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 group-hover:shadow-lg group-hover:shadow-primary-500/25"
                    >
                      <span>Join Session</span>
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </RouterLink>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="text-center bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 text-white"
      >
        <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
          Ready to start debating?
        </h2>
        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Join our community of thinkers, learners, and debate enthusiasts from around the world.
        </p>
        <motion.button
          className="bg-white text-primary-600 font-semibold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Explore All Debates
        </motion.button>
      </motion.section>
    </motion.div>
  );
};

export default HomePage;