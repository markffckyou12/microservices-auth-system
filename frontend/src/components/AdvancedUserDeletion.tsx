import React, { useState } from 'react';
import { useDeleteUser, useUpdateUser } from '../hooks/useUsers';

interface DeletionOptions {
  type: 'soft' | 'hard' | 'anonymize';
  retentionPeriod: number; // days
  backupData: boolean;
  notifyUser: boolean;
  reason: string;
  cascadeDelete: boolean;
}

interface AdvancedUserDeletionProps {
  userId: string;
  userData: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    roles: string[];
    createdAt: string;
  };
  onDeletionComplete: () => void;
  onCancel: () => void;
}

const AdvancedUserDeletion: React.FC<AdvancedUserDeletionProps> = ({
  userId,
  userData,
  onDeletionComplete,
  onCancel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletionOptions, setDeletionOptions] = useState<DeletionOptions>({
    type: 'soft',
    retentionPeriod: 30,
    backupData: true,
    notifyUser: false,
    reason: '',
    cascadeDelete: false
  });

  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();

  const deletionTypes = [
    {
      value: 'soft',
      label: 'Soft Delete',
      description: 'Mark user as inactive but retain all data',
      icon: '🔄',
      color: 'text-blue-600'
    },
    {
      value: 'anonymize',
      label: 'Anonymize',
      description: 'Remove personal data but keep account structure',
      icon: '👤',
      color: 'text-yellow-600'
    },
    {
      value: 'hard',
      label: 'Hard Delete',
      description: 'Permanently remove user and all associated data',
      icon: '🗑️',
      color: 'text-red-600'
    }
  ];

  const handleDeletionTypeChange = (type: 'soft' | 'hard' | 'anonymize') => {
    setDeletionOptions(prev => ({ ...prev, type }));
  };

  const anonymizeUserData = (user: any) => {
    return {
      firstName: 'Anonymous',
      lastName: 'User',
      email: `anonymous.${user.id}@deleted.local`,
      username: `deleted_${user.id}`,
      isActive: false
    };
  };

  const performSoftDelete = async () => {
    await updateUserMutation.mutateAsync({
      userId,
      userData: { isActive: false }
    });
  };

  const performAnonymize = async () => {
    const anonymizedData = anonymizeUserData(userData);
    await updateUserMutation.mutateAsync({
      userId,
      userData: anonymizedData
    });
  };

  const performHardDelete = async () => {
    await deleteUserMutation.mutateAsync(userId);
  };

  const createBackup = async () => {
    // Simulate backup creation
    const backupData = {
      user: userData,
      deletedAt: new Date().toISOString(),
      deletedBy: 'current-user', // This would come from auth context
      reason: deletionOptions.reason,
      retentionPeriod: deletionOptions.retentionPeriod
    };

    // In a real implementation, this would be sent to a backup service
    console.log('Creating backup:', backupData);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const sendNotification = async () => {
    // Simulate sending notification to user
    console.log('Sending notification to user:', userData.email);
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const handleDelete = async () => {
    if (!deletionOptions.reason.trim()) {
      alert('Please provide a reason for deletion');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Create backup (if enabled)
      if (deletionOptions.backupData) {
        setProgress(10);
        await createBackup();
        setProgress(30);
      }

      // Step 2: Send notification (if enabled)
      if (deletionOptions.notifyUser) {
        setProgress(40);
        await sendNotification();
        setProgress(50);
      }

      // Step 3: Perform deletion
      setProgress(60);
      switch (deletionOptions.type) {
        case 'soft':
          await performSoftDelete();
          break;
        case 'anonymize':
          await performAnonymize();
          break;
        case 'hard':
          await performHardDelete();
          break;
      }
      setProgress(90);

      // Step 4: Cleanup and finalize
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Show success message
      const actionText = {
        soft: 'deactivated',
        anonymize: 'anonymized',
        hard: 'permanently deleted'
      }[deletionOptions.type];

      alert(`User ${userData.username} has been successfully ${actionText}`);
      
      onDeletionComplete();
      setIsOpen(false);
    } catch (error) {
      console.error('Deletion failed:', error);
      alert(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const getRiskLevel = () => {
    switch (deletionOptions.type) {
      case 'soft':
        return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
      case 'anonymize':
        return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'hard':
        return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { level: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const riskLevel = getRiskLevel();

  return (
    <>
      {/* Delete Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete User
      </button>

      {/* Deletion Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete User: {userData.firstName} {userData.lastName}
                </h3>
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-700">
                      {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {userData.firstName} {userData.lastName}
                    </h4>
                    <p className="text-sm text-gray-500">@{userData.username}</p>
                    <p className="text-sm text-gray-500">{userData.email}</p>
                    <p className="text-sm text-gray-500">
                      Member since {new Date(userData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userData.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deletion Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Deletion Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {deletionTypes.map((type) => (
                    <label key={type.value} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deletionType"
                        value={type.value}
                        checked={deletionOptions.type === type.value}
                        onChange={() => handleDeletionTypeChange(type.value as any)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{type.icon}</span>
                          <div className={`text-sm font-medium ${type.color}`}>{type.label}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="mb-6 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Risk Assessment</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Impact level of this deletion operation
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskLevel.color} ${riskLevel.bg}`}>
                    {riskLevel.level} Risk
                  </span>
                </div>
              </div>

              {/* Deletion Options */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Deletion *
                  </label>
                  <textarea
                    value={deletionOptions.reason}
                    onChange={(e) => setDeletionOptions(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please provide a reason for deleting this user..."
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Retention Period (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={deletionOptions.retentionPeriod}
                      onChange={(e) => setDeletionOptions(prev => ({ 
                        ...prev, 
                        retentionPeriod: parseInt(e.target.value) || 30 
                      }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deletionOptions.backupData}
                      onChange={(e) => setDeletionOptions(prev => ({ 
                        ...prev, 
                        backupData: e.target.checked 
                      }))}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      disabled={isProcessing}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Create backup before deletion
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deletionOptions.notifyUser}
                      onChange={(e) => setDeletionOptions(prev => ({ 
                        ...prev, 
                        notifyUser: e.target.checked 
                      }))}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      disabled={isProcessing}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Send notification to user
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deletionOptions.cascadeDelete}
                      onChange={(e) => setDeletionOptions(prev => ({ 
                        ...prev, 
                        cascadeDelete: e.target.checked 
                      }))}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      disabled={isProcessing}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Cascade delete related data
                    </span>
                  </label>
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Processing deletion...</span>
                    <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isProcessing || !deletionOptions.reason.trim()}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdvancedUserDeletion; 