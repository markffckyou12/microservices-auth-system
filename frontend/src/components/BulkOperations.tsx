import React, { useState } from 'react';
import { useUpdateUser, useDeleteUser } from '../hooks/useUsers';

interface BulkOperationsProps {
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
  onOperationComplete: () => void;
  availableRoles?: string[];
}

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: (userIds: string[]) => Promise<void>;
  confirmMessage: string;
  successMessage: string;
  danger?: boolean;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedUsers,
  onSelectionChange,
  onOperationComplete,
  availableRoles = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const bulkOperations: BulkOperation[] = [
    {
      id: 'activate',
      name: 'Activate Users',
      description: 'Activate all selected users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: async (userIds: string[]) => {
        const promises = userIds.map(userId => 
          updateUserMutation.mutateAsync({ 
            userId, 
            userData: { status: 'active' } 
          })
        );
        await Promise.all(promises);
      },
      confirmMessage: `Are you sure you want to activate ${selectedUsers.length} user(s)?`,
      successMessage: `Successfully activated ${selectedUsers.length} user(s)`
    },
    {
      id: 'deactivate',
      name: 'Deactivate Users',
      description: 'Deactivate all selected users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: async (userIds: string[]) => {
        const promises = userIds.map(userId => 
          updateUserMutation.mutateAsync({ 
            userId, 
            userData: { status: 'inactive' } 
          })
        );
        await Promise.all(promises);
      },
      confirmMessage: `Are you sure you want to deactivate ${selectedUsers.length} user(s)?`,
      successMessage: `Successfully deactivated ${selectedUsers.length} user(s)`,
      danger: true
    },
    {
      id: 'delete',
      name: 'Delete Users',
      description: 'Permanently delete all selected users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      action: async (userIds: string[]) => {
        const promises = userIds.map(userId => 
          deleteUserMutation.mutateAsync(userId)
        );
        await Promise.all(promises);
      },
      confirmMessage: `Are you sure you want to permanently delete ${selectedUsers.length} user(s)? This action cannot be undone.`,
      successMessage: `Successfully deleted ${selectedUsers.length} user(s)`,
      danger: true
    },
    {
      id: 'export',
      name: 'Export Users',
      description: 'Export selected users to CSV',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: async (userIds: string[]) => {
        // Simulate export process
        for (let i = 0; i < userIds.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setProgress(((i + 1) / userIds.length) * 100);
        }
        
        // Create and download CSV
        const csvContent = `ID,Username,Email,First Name,Last Name,Status,Created At\n${userIds.join(',')}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      confirmMessage: `Export ${selectedUsers.length} user(s) to CSV?`,
      successMessage: `Successfully exported ${selectedUsers.length} user(s)`
    }
  ];

  const handleOperationSelect = (operation: BulkOperation) => {
    setSelectedOperation(operation);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!selectedOperation) return;

    setIsProcessing(true);
    setProgress(0);
    setShowConfirmation(false);

    try {
      await selectedOperation.action(selectedUsers);
      
      // Show success message
      alert(selectedOperation.successMessage);
      
      // Clear selection and refresh
      onSelectionChange([]);
      onOperationComplete();
    } catch (error) {
      alert(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setSelectedOperation(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedOperation(null);
  };

  const selectAll = () => {
    // This would need to be implemented with the actual user list
    // For now, we'll just show the interface
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Operations Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedUsers.length > 0}
                onChange={selectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-900">
                {selectedUsers.length} user(s) selected
              </span>
            </div>
            
            <button
              onClick={clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Bulk Actions
            </button>
          </div>
        </div>

        {/* Operations Dropdown */}
        {isOpen && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select an operation:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bulkOperations.map((operation) => (
                <button
                  key={operation.id}
                  onClick={() => handleOperationSelect(operation)}
                  className={`flex items-center p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                    operation.danger 
                      ? 'border-red-200 hover:border-red-300' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`flex-shrink-0 mr-3 ${
                    operation.danger ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {operation.icon}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${
                      operation.danger ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      {operation.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {operation.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedOperation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                {selectedOperation.danger ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm {selectedOperation.name}
                </h3>
                <div className="mt-2 px-7">
                  <p className="text-sm text-gray-500">
                    {selectedOperation.confirmMessage}
                  </p>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-24 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className={`px-4 py-2 text-base font-medium rounded-md w-24 shadow-sm focus:outline-none focus:ring-2 ${
                      selectedOperation.danger
                        ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    } disabled:opacity-50`}
                  >
                    {isProcessing ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {isProcessing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
              <div className="mt-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Processing {selectedOperation?.name}
                </h3>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {Math.round(progress)}% complete
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkOperations; 