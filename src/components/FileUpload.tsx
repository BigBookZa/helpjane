import React, { useState, useCallback } from 'react';
import { Upload, X, Image, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { uploadFiles } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

interface FileUploadProps {
  projectId?: number;
  onFilesUploaded?: (files: any[]) => void;
  maxFileSize?: number; // in MB
  allowedFormats?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  projectId,
  onFilesUploaded,
  maxFileSize = 10,
  allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'heic']
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useNotifications();

  const validateFile = (file: File): string | null => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      return `File format not supported. Allowed: ${allowedFormats.join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }
    
    return null;
  };

  const handleFiles = useCallback((files: FileList) => {
    const newFiles: File[] = [];
    const newErrors: string[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        newFiles.push(file);
      }
    });

    setErrors(newErrors);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, [maxFileSize, allowedFormats]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select files to upload');
      return;
    }
    
    if (!projectId) {
      showError('No project selected');
      return;
    }
      showError('Please select files to upload');
      return;
    }
    
    if (!projectId) {
      showError('No project selected');
      return;
    }
    
    setUploading(true);
    try {
      console.log('Uploading files:', selectedFiles.length, 'to project:', projectId);
      
      console.log('Uploading files:', selectedFiles.length, 'to project:', projectId);
      
      const result = await uploadFiles({
        files: selectedFiles,
        projectId
      });

      console.log('Upload result:', result);
      showSuccess(`${selectedFiles.length} files uploaded successfully`);
      onFilesUploaded?.(result.files || []);
      onFilesUploaded?.(result.files || []);
      setSelectedFiles([]);
      setErrors([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Upload failed';
      showError(errorMessage);
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Upload failed';
      showError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={allowedFormats.map(format => `.${format}`).join(',')}
          onChange={handleFileInput}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-sm text-gray-600">
              Supported formats: {allowedFormats.join(', ').toUpperCase()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: {maxFileSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">Upload Errors</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Ready to Upload ({selectedFiles.length} files)
            </h4>
            <button
              onClick={handleUpload}
              disabled={uploading || !projectId}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Files</span>
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Image className="w-5 h-5 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                  className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Selection Warning */}
      {!projectId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">No Project Selected</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please select a project before uploading files.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Project Selection Warning */}
      {!projectId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">No Project Selected</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please select a project before uploading files.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;