import React, { useState, useEffect, useRef } from 'react';
import { useUpdateUser } from '../hooks/useUsers';

interface InlineEditorProps {
  value: string;
  field: string;
  userId: string;
  onSave?: (value: string) => void;
  onCancel?: () => void;
  type?: 'text' | 'email' | 'select';
  options?: { value: string; label: string }[];
  validation?: (value: string) => string | null;
  placeholder?: string;
  className?: string;
}

const InlineEditor: React.FC<InlineEditorProps> = ({
  value: initialValue,
  field,
  userId,
  onSave,
  onCancel,
  type = 'text',
  options = [],
  validation,
  placeholder,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'email') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValue(initialValue);
    setError(null);
    onCancel?.();
  };

  const validateValue = (val: string): boolean => {
    if (validation) {
      const validationError = validation(val);
      if (validationError) {
        setError(validationError);
        return false;
      }
    }

    // Basic validation
    if (type === 'email' && val) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    if (val.trim() === '') {
      setError('This field is required');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateValue(value)) {
      return;
    }

    setIsSaving(true);
    try {
      const updateData = { [field]: value };
      await updateUserMutation.mutateAsync({ userId, userData: updateData });
      
      setIsEditing(false);
      onSave?.(value);
    } catch (error) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow for button clicks
    setTimeout(() => {
      if (isEditing && !isSaving) {
        handleSave();
      }
    }, 100);
  };

  if (!isEditing) {
    return (
      <div 
        className={`inline-block cursor-pointer hover:bg-gray-50 px-2 py-1 rounded ${className}`}
        onClick={handleStartEdit}
        title="Click to edit"
      >
        {type === 'select' && options.length > 0 ? (
          <span className="text-gray-900">
            {options.find(opt => opt.value === value)?.label || value}
          </span>
        ) : (
          <span className="text-gray-900">{value || placeholder}</span>
        )}
        <svg 
          className="inline-block w-4 h-4 ml-1 text-gray-400 opacity-0 group-hover:opacity-100" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="inline-block">
      <div className="flex items-center space-x-2">
        {type === 'select' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
          />
        )}
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
            title="Save"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
            title="Cancel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
};

export default InlineEditor; 