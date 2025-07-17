import React, { useState, useRef } from 'react';
import { useUsers } from '../hooks/useUsers';

interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  includeFields: string[];
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    status: 'all' | 'active' | 'inactive';
    roles: string[];
  };
  compression: boolean;
}

interface ExportManagerProps {
  onExportComplete?: (filename: string) => void;
  availableRoles?: string[];
}

const ExportManager: React.FC<ExportManagerProps> = ({
  onExportComplete,
  availableRoles = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeFields: ['id', 'username', 'email', 'firstName', 'lastName', 'status', 'createdAt'],
    dateRange: {
      start: '',
      end: ''
    },
    filters: {
      status: 'all',
      roles: []
    },
    compression: false
  });

  const { data: usersData, refetch } = useUsers({
    page: 1,
    limit: 1000, // Get all users for export
    status: exportOptions.filters.status
  });

  const availableFields = [
    { id: 'id', label: 'User ID', type: 'text' },
    { id: 'username', label: 'Username', type: 'text' },
    { id: 'email', label: 'Email Address', type: 'text' },
    { id: 'firstName', label: 'First Name', type: 'text' },
    { id: 'lastName', label: 'Last Name', type: 'text' },
    { id: 'status', label: 'Status', type: 'text' },
    { id: 'roles', label: 'Roles', type: 'array' },
    { id: 'createdAt', label: 'Created Date', type: 'date' },
    { id: 'updatedAt', label: 'Last Updated', type: 'date' },
    { id: 'lastLogin', label: 'Last Login', type: 'date' }
  ];

  const handleFieldToggle = (fieldId: string) => {
    setExportOptions(prev => ({
      ...prev,
      includeFields: prev.includeFields.includes(fieldId)
        ? prev.includeFields.filter(f => f !== fieldId)
        : [...prev.includeFields, fieldId]
    }));
  };

  const handleRoleToggle = (role: string) => {
    setExportOptions(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        roles: prev.filters.roles.includes(role)
          ? prev.filters.roles.filter(r => r !== role)
          : [...prev.filters.roles, role]
      }
    }));
  };

  const generateCSV = (users: any[]): string => {
    if (users.length === 0) return '';

    const headers = exportOptions.includeFields.map(field => {
      const fieldInfo = availableFields.find(f => f.id === field);
      return fieldInfo?.label || field;
    });

    const rows = users.map(user => {
      return exportOptions.includeFields.map(field => {
        switch (field) {
          case 'roles':
            return user.roles?.join(', ') || '';
          case 'createdAt':
          case 'updatedAt':
          case 'lastLogin':
            return user[field] ? new Date(user[field]).toISOString() : '';
          case 'status':
            return user.isActive ? 'Active' : 'Inactive';
          default:
            return user[field] || '';
        }
      });
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generateExcel = async (users: any[]): Promise<Blob> => {
    // For now, we'll create a CSV that Excel can open
    // In a real implementation, you'd use a library like xlsx
    const csvContent = generateCSV(users);
    return new Blob([csvContent], { type: 'text/csv' });
  };

  const generateJSON = (users: any[]): string => {
    const filteredUsers = users.map(user => {
      const filteredUser: any = {};
      exportOptions.includeFields.forEach(field => {
        switch (field) {
          case 'status':
            filteredUser[field] = user.isActive ? 'Active' : 'Inactive';
            break;
          default:
            filteredUser[field] = user[field];
        }
      });
      return filteredUser;
    });

    return JSON.stringify(filteredUsers, null, 2);
  };

  const handleExport = async () => {
    if (exportOptions.includeFields.length === 0) {
      alert('Please select at least one field to export');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Fetch users if not already loaded
      let users = usersData?.users || [];
      if (users.length === 0) {
        await refetch();
        users = usersData?.users || [];
      }

      // Apply filters
      let filteredUsers = users;
      
      if (exportOptions.filters.roles.length > 0) {
        filteredUsers = users.filter(user => 
          user.roles?.some((role: string) => exportOptions.filters.roles.includes(role))
        );
      }

      if (exportOptions.dateRange.start || exportOptions.dateRange.end) {
        filteredUsers = users.filter(user => {
          const createdAt = new Date(user.createdAt);
          const startDate = exportOptions.dateRange.start ? new Date(exportOptions.dateRange.start) : null;
          const endDate = exportOptions.dateRange.end ? new Date(exportOptions.dateRange.end) : null;
          
          if (startDate && createdAt < startDate) return false;
          if (endDate && createdAt > endDate) return false;
          return true;
        });
      }

      setProgress(95);

      // Generate export content
      let content: string | Blob;
      let filename: string;
      let mimeType: string;

      switch (exportOptions.format) {
        case 'csv':
          content = generateCSV(filteredUsers);
          filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'excel':
          content = await generateExcel(filteredUsers);
          filename = `users-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'json':
          content = generateJSON(filteredUsers);
          filename = `users-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      setProgress(100);

      // Create and download file
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      clearInterval(progressInterval);
      
      // Show success message
      alert(`Successfully exported ${filteredUsers.length} users to ${exportOptions.format.toUpperCase()}`);
      
      onExportComplete?.(filename);
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Users
      </button>

      {/* Export Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Export Users
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Export Format */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
                    { value: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
                    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' }
                  ].map((format) => (
                    <label key={format.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={exportOptions.format === format.value}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{format.label}</div>
                        <div className="text-xs text-gray-500">{format.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fields to Include */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fields to Include
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {availableFields.map((field) => (
                    <label key={field.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeFields.includes(field.id)}
                        onChange={() => handleFieldToggle(field.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filters
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <select
                      value={exportOptions.filters.status}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        filters: { ...prev.filters, status: e.target.value as any }
                      }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="all">All Users</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Roles</label>
                    <div className="grid grid-cols-2 gap-1 max-h-20 overflow-y-auto">
                      {availableRoles.map((role) => (
                        <label key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={exportOptions.filters.roles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            className="h-3 w-3 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="ml-1 text-xs text-gray-700 capitalize">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.start}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.end}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isExporting && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Exporting...</span>
                    <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isExporting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting || exportOptions.includeFields.length === 0}
                  className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportManager; 