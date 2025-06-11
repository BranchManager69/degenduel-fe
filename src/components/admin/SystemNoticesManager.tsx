import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { admin } from '../../services/api/admin';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface SystemNotice {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const SystemNoticesManager: React.FC = () => {
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<SystemNotice | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as SystemNotice['type'],
    is_active: true,
    start_date: '',
    end_date: ''
  });

  // Fetch all notices
  const fetchNotices = async () => {
    setLoading(true);
    try {
      const notices = await admin.systemNotices.list();
      setNotices(notices);
    } catch (error) {
      console.error('Failed to fetch system notices:', error);
      toast.error('Failed to load system notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Create or update notice
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (editingNotice) {
        await admin.systemNotices.update(editingNotice.id, payload);
        toast.success('Notice updated successfully');
      } else {
        await admin.systemNotices.create(payload);
        toast.success('Notice created successfully');
      }
      
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error('Failed to save notice:', error);
      toast.error('Failed to save notice');
    }
  };

  // Delete notice
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      await admin.systemNotices.delete(id);
      toast.success('Notice deleted successfully');
      fetchNotices();
    } catch (error) {
      console.error('Failed to delete notice:', error);
      toast.error('Failed to delete notice');
    }
  };

  // Toggle active status
  const handleToggleActive = async (notice: SystemNotice) => {
    try {
      await admin.systemNotices.toggleActive(notice.id);
      toast.success(`Notice ${notice.is_active ? 'deactivated' : 'activated'}`);
      fetchNotices();
    } catch (error) {
      console.error('Failed to toggle notice status:', error);
      toast.error('Failed to update notice status');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      is_active: true,
      start_date: '',
      end_date: ''
    });
    setEditingNotice(null);
    setShowCreateForm(false);
  };

  // Edit notice
  const handleEdit = (notice: SystemNotice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      message: notice.message,
      type: notice.type,
      is_active: notice.is_active,
      start_date: notice.start_date ? format(new Date(notice.start_date), "yyyy-MM-dd'T'HH:mm") : '',
      end_date: notice.end_date ? format(new Date(notice.end_date), "yyyy-MM-dd'T'HH:mm") : ''
    });
    setShowCreateForm(true);
  };

  const typeStyles = {
    info: {
      bg: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: 'ℹ️',
      glow: 'shadow-blue-500/20'
    },
    warning: {
      bg: 'from-yellow-500/10 to-amber-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: '⚠️',
      glow: 'shadow-yellow-500/20'
    },
    error: {
      bg: 'from-red-500/10 to-rose-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: '🚨',
      glow: 'shadow-red-500/20'
    },
    success: {
      bg: 'from-green-500/10 to-emerald-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: '✅',
      glow: 'shadow-green-500/20'
    }
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-lg p-8 rounded-lg border border-brand-500/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.1)_0%,transparent_60%)]" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="font-cyber tracking-wider text-lg sm:text-xl lg:text-2xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
              SYSTEM NOTICES
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1 truncate">
              GLOBAL_NOTIFICATION_MANAGEMENT_INTERFACE
            </p>
          </div>
          <div
            className={`h-3 w-3 rounded-full flex-shrink-0 ml-4 ${
              notices.some(n => n.is_active) ? "bg-purple-500 animate-pulse" : "bg-gray-500"
            }`}
          />
        </div>

        {/* Create Notice Button */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full group relative mb-6"
        >
          <motion.div
            className={`
              relative overflow-hidden rounded-lg border-2 
              ${showCreateForm 
                ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20" 
                : "border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20"
              }
              transition-all duration-300
            `}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <div
                className={`
                w-6 h-6 rounded-full border-2 
                ${showCreateForm ? "border-red-500" : "border-purple-500"}
                transition-colors duration-300
              `}
              >
                <div
                  className={`
                  w-1 h-3 
                  ${showCreateForm ? "bg-red-500" : "bg-purple-500"}
                  transition-colors duration-300
                  absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2
                `}
                />
              </div>
            </div>

            <div className="px-6 py-4 pl-12">
              <div className="font-cyber tracking-wider text-lg">
                {showCreateForm ? (
                  <span className="text-red-400 group-hover:text-red-300">
                    CANCEL OPERATION
                  </span>
                ) : (
                  <span className="text-purple-400 group-hover:text-purple-300">
                    CREATE NOTICE
                  </span>
                )}
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </motion.div>

          <div className="absolute -right-3 top-1/2 -translate-y-1/2">
            <div
              className={`
              w-6 h-6 rounded-full 
              ${showCreateForm
                ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                : "bg-purple-500 shadow-lg shadow-purple-500/50"
              }
              transition-colors duration-300
            `}
            />
          </div>
        </button>

        {/* Create/Edit Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="mb-6 p-6 bg-dark-200/30 backdrop-blur-sm rounded-lg border border-brand-500/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5" />
              
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wide">
                      NOTICE_TITLE [OPTIONAL]
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-200/50 border border-brand-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
                      placeholder="MAINTENANCE_ALERT"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wide">
                      ALERT_TYPE
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as SystemNotice['type'] })}
                      className="w-full px-4 py-3 bg-dark-200/50 border border-brand-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
                    >
                      <option value="info">INFO</option>
                      <option value="warning">WARNING</option>
                      <option value="error">ERROR</option>
                      <option value="success">SUCCESS</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wide">
                      MESSAGE_CONTENT
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-200/50 border border-brand-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
                      rows={3}
                      required
                      placeholder="ENTER_SYSTEM_NOTIFICATION_MESSAGE..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wide">
                      START_TIMESTAMP [OPTIONAL]
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-200/50 border border-brand-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-3 font-mono tracking-wide">
                      END_TIMESTAMP [OPTIONAL]
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-200/50 border border-brand-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500 bg-dark-200 border-brand-500"
                    />
                    <label htmlFor="is_active" className="text-sm text-purple-300 font-mono tracking-wide">
                      ACTIVATE_IMMEDIATELY
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 font-cyber tracking-wider shadow-lg shadow-green-500/20"
                  >
                    {editingNotice ? 'UPDATE_NOTICE' : 'CREATE_NOTICE'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg transition-all duration-300 font-cyber tracking-wider"
                  >
                    CANCEL_OPERATION
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Notices List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400 font-mono">
              <div className="animate-pulse">LOADING_NOTICES...</div>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-mono">
              NO_SYSTEM_NOTICES_FOUND
            </div>
          ) : (
            notices.map((notice) => {
              const isCurrentlyActive = notice.is_active && (
                !notice.start_date || new Date(notice.start_date) <= new Date()
              ) && (
                !notice.end_date || new Date(notice.end_date) >= new Date()
              );

              const style = typeStyles[notice.type];

              return (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-lg border bg-gradient-to-r ${style.bg} ${style.border} relative overflow-hidden backdrop-blur-sm ${
                    isCurrentlyActive ? `ring-2 ring-offset-2 ring-offset-dark-200 ring-${notice.type === 'info' ? 'blue' : notice.type === 'warning' ? 'yellow' : notice.type === 'error' ? 'red' : 'green'}-500 ${style.glow}` : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl">{style.icon}</span>
                        {notice.title && (
                          <h4 className={`font-cyber tracking-wider ${style.text}`}>{notice.title}</h4>
                        )}
                        <span className={`px-3 py-1 text-xs font-mono rounded-full ${style.text} ${style.border} bg-black/20`}>
                          {notice.type.toUpperCase()}
                        </span>
                        {isCurrentlyActive && (
                          <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full font-mono animate-pulse">
                            LIVE
                          </span>
                        )}
                        {!notice.is_active && (
                          <span className="px-3 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full font-mono">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mb-4 ${style.text} font-mono`}>{notice.message}</p>
                      <div className="text-xs opacity-60 space-y-1 font-mono">
                        {notice.start_date && (
                          <div>START: {format(new Date(notice.start_date), 'MMM d, yyyy HH:mm')}</div>
                        )}
                        {notice.end_date && (
                          <div>END: {format(new Date(notice.end_date), 'MMM d, yyyy HH:mm')}</div>
                        )}
                        <div>CREATED: {format(new Date(notice.created_at), 'MMM d, yyyy HH:mm')}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={() => handleToggleActive(notice)}
                        className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-cyber tracking-wider ${
                          notice.is_active
                            ? 'bg-gray-600/50 hover:bg-gray-700/50 text-white border border-gray-500/30'
                            : 'bg-green-600/50 hover:bg-green-700/50 text-white border border-green-500/30'
                        }`}
                      >
                        {notice.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                      </button>
                      <button
                        onClick={() => handleEdit(notice)}
                        className="px-4 py-2 text-sm bg-blue-600/50 hover:bg-blue-700/50 text-white rounded-lg transition-all duration-200 font-cyber tracking-wider border border-blue-500/30"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="px-4 py-2 text-sm bg-red-600/50 hover:bg-red-700/50 text-white rounded-lg transition-all duration-200 font-cyber tracking-wider border border-red-500/30"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};