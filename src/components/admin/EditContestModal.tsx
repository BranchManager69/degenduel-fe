import React, { useState, useEffect } from 'react';
import { Contest } from '../../types';

interface EditContestModalProps {
  contest: Contest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contestId: number, data: Partial<Contest>) => Promise<void>;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  entry_fee?: string;
  prize_pool?: string;
  settings?: {
    max_participants?: string;
    min_trades?: string;
    difficulty?: string;
  };
  start_time?: string;
  end_time?: string;
}

export const EditContestModal: React.FC<EditContestModalProps> = ({
  contest,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Contest>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (contest) {
      setFormData(contest);
      setError(null);
      setValidationErrors({});
    }
  }, [contest]);

  if (!isOpen || !contest) return null;

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.entry_fee || Number(formData.entry_fee) <= 0) {
      errors.entry_fee = 'Entry fee must be greater than 0';
    }

    if (!formData.prize_pool || Number(formData.prize_pool) <= 0) {
      errors.prize_pool = 'Prize pool must be greater than 0';
    }

    if (!formData.settings?.max_participants || formData.settings.max_participants < 2) {
      errors.settings = {
        ...errors.settings,
        max_participants: 'Must allow at least 2 participants'
      };
    }

    const startTime = new Date(formData.start_time || '');
    const endTime = new Date(formData.end_time || '');

    if (isNaN(startTime.getTime())) {
      errors.start_time = 'Valid start time is required';
    }

    if (isNaN(endTime.getTime())) {
      errors.end_time = 'Valid end time is required';
    }

    if (startTime >= endTime) {
      errors.end_time = 'End time must be after start time';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(contest.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contest');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof Contest | 'settings',
    value: any
  ) => {
    if (field === 'settings') {
      setFormData(prev => ({
        ...prev,
        settings: { ...(prev.settings || {}), ...value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear validation error for this field
    if (field === 'settings') {
      setValidationErrors(prev => ({
        ...prev,
        settings: undefined
      }));
    } else if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Contest</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.name ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.name && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full bg-dark-300 rounded p-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={formData.settings?.difficulty || ''}
              onChange={(e) => handleInputChange('settings', {
                ...formData.settings,
                difficulty: e.target.value
              })}
              className="w-full bg-dark-300 rounded p-2"
            >
              <option value="guppy">Guppy</option>
              <option value="tadpole">Tadpole</option>
              <option value="squid">Squid</option>
              <option value="dolphin">Dolphin</option>
              <option value="shark">Shark</option>
              <option value="whale">Whale</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Entry Fee</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.entry_fee || ''}
              onChange={(e) => handleInputChange('entry_fee', e.target.value)}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.entry_fee ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.entry_fee && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.entry_fee}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prize Pool</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.prize_pool || ''}
              onChange={(e) => handleInputChange('prize_pool', e.target.value)}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.prize_pool ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.prize_pool && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.prize_pool}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={formData.start_time?.slice(0, 16) || ''}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.start_time ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.start_time && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.start_time}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="datetime-local"
              value={formData.end_time?.slice(0, 16) || ''}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.end_time ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.end_time && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.end_time}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Max Participants</label>
            <input
              type="number"
              min="2"
              value={formData.settings?.max_participants || ''}
              onChange={(e) => handleInputChange('settings', {
                ...formData.settings,
                max_participants: Number(e.target.value)
              })}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.settings?.max_participants ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.settings?.max_participants && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.settings.max_participants}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Minimum Trades</label>
            <input
              type="number"
              min="1"
              value={formData.settings?.min_trades || ''}
              onChange={(e) => handleInputChange('settings', {
                ...formData.settings,
                min_trades: Number(e.target.value)
              })}
              className="w-full bg-dark-300 rounded p-2"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-500/10 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-dark-300 rounded hover:bg-dark-400 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 rounded hover:bg-brand-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};