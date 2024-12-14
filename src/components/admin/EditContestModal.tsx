import React, { useState, useEffect } from 'react';
import { Contest } from '../../types/admin';

interface EditContestModalProps {
  contest: Contest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contestId: string, data: Partial<Contest>) => Promise<void>;
}

interface ValidationErrors {
  name?: string;
  entryFee?: string;
  prizePool?: string;
  maxParticipants?: string;
  startTime?: string;
  endTime?: string;
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

  // Reset form when contest changes
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

    if (!formData.entryFee || formData.entryFee <= 0) {
      errors.entryFee = 'Entry fee must be greater than 0';
    }

    if (!formData.prizePool || formData.prizePool <= 0) {
      errors.prizePool = 'Prize pool must be greater than 0';
    }

    if (!formData.maxParticipants || formData.maxParticipants < 2) {
      errors.maxParticipants = 'Must allow at least 2 participants';
    }

    const startTime = new Date(formData.startTime || '');
    const endTime = new Date(formData.endTime || '');

    if (isNaN(startTime.getTime())) {
      errors.startTime = 'Valid start time is required';
    }

    if (isNaN(endTime.getTime())) {
      errors.endTime = 'Valid end time is required';
    }

    if (startTime >= endTime) {
      errors.endTime = 'End time must be after start time';
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
    field: keyof Contest,
    value: string | number
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors && (field in validationErrors)) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
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
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={formData.difficulty || ''}
              onChange={(e) => handleInputChange('difficulty', e.target.value)}
              className="w-full bg-dark-300 rounded p-2"
            >
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
              value={formData.entryFee || ''}
              onChange={(e) => handleInputChange('entryFee', Number(e.target.value))}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.entryFee ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.entryFee && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.entryFee}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prize Pool</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.prizePool || ''}
              onChange={(e) => handleInputChange('prizePool', Number(e.target.value))}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.prizePool ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.prizePool && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.prizePool}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={formData.startTime?.slice(0, 16) || ''}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.startTime ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.startTime && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.startTime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="datetime-local"
              value={formData.endTime?.slice(0, 16) || ''}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.endTime ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.endTime && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.endTime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Max Participants</label>
            <input
              type="number"
              min="2"
              value={formData.maxParticipants || ''}
              onChange={(e) => handleInputChange('maxParticipants', Number(e.target.value))}
              className={`w-full bg-dark-300 rounded p-2 ${
                validationErrors.maxParticipants ? 'border border-red-500' : ''
              }`}
            />
            {validationErrors.maxParticipants && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.maxParticipants}</p>
            )}
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
