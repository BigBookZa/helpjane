import React, { useState } from 'react';
import { X, Save, Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { FileData } from '../store/useStore';

interface BulkEditModalProps {
  files: FileData[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { id: number; data: Partial<FileData> }[]) => void;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  files,
  isOpen,
  onClose,
  onSave
}) => {
  const [csvData, setCsvData] = useState('');
  const [mode, setMode] = useState<'edit' | 'import'>('edit');
  const [errors, setErrors] = useState<string[]>([]);

  const adobeCategories = [
    'Abstract', 'Animals/Wildlife', 'Arts', 'Backgrounds/Textures', 'Beauty/Fashion',
    'Buildings/Landmarks', 'Business/Finance', 'Celebrities', 'Education', 'Food and Drink',
    'Healthcare/Medical', 'Holidays', 'Industrial', 'Interiors', 'Miscellaneous',
    'Nature', 'Objects', 'Parks/Outdoor', 'People', 'Religion', 'Science',
    'Signs/Symbols', 'Sports/Recreation', 'Technology', 'Transportation', 'Travel'
  ];

  const generateCSV = () => {
    const headers = [
      'id',
      'filename',
      'newNamePhoto',
      'titleAdobe',
      'description',
      'keywords',
      'prompt',
      'keysAdobe',
      'adobeCategory',
      'notes',
      'tags'
    ];

    const rows = files.map(file => [
      file.id,
      file.filename,
      file.newNamePhoto || '',
      file.titleAdobe || '',
      file.description || '',
      file.keywords.join('; '),
      file.prompt || '',
      file.keysAdobe.join('; '),
      file.adobeCategory || '',
      file.notes || '',
      file.tags.join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    setCsvData(csvContent);
    setMode('edit');
  };

  const parseCSV = (csvText: string): { id: number; data: Partial<FileData> }[] | null => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setErrors(['CSV must contain at least a header row and one data row']);
        return null;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const expectedHeaders = [
        'id', 'filename', 'newNamePhoto', 'titleAdobe', 'description',
        'keywords', 'prompt', 'keysAdobe', 'adobeCategory', 'notes', 'tags'
      ];

      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setErrors([`Missing required headers: ${missingHeaders.join(', ')}`]);
        return null;
      }

      const updates: { id: number; data: Partial<FileData> }[] = [];
      const newErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const id = parseInt(row.id);
        if (isNaN(id)) {
          newErrors.push(`Row ${i}: Invalid ID`);
          continue;
        }

        const fileExists = files.find(f => f.id === id);
        if (!fileExists) {
          newErrors.push(`Row ${i}: File with ID ${id} not found`);
          continue;
        }

        // Validate Adobe category
        if (row.adobeCategory && !adobeCategories.includes(row.adobeCategory)) {
          newErrors.push(`Row ${i}: Invalid Adobe category "${row.adobeCategory}"`);
          continue;
        }

        const data: Partial<FileData> = {
          newNamePhoto: row.newNamePhoto,
          titleAdobe: row.titleAdobe,
          description: row.description,
          keywords: row.keywords ? row.keywords.split(';').map(k => k.trim()).filter(k => k) : [],
          prompt: row.prompt,
          keysAdobe: row.keysAdobe ? row.keysAdobe.split(';').map(k => k.trim()).filter(k => k) : [],
          adobeCategory: row.adobeCategory,
          notes: row.notes,
          tags: row.tags ? row.tags.split(';').map(t => t.trim()).filter(t => t) : []
        };

        updates.push({ id, data });
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        return null;
      }

      setErrors([]);
      return updates;
    } catch (error) {
      setErrors(['Failed to parse CSV. Please check the format.']);
      return null;
    }
  };

  const handleSave = () => {
    if (mode === 'import') {
      const updates = parseCSV(csvData);
      if (updates) {
        onSave(updates);
        onClose();
      }
    }
  };

  const handleExport = () => {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-edit-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
        setMode('import');
      };
      reader.readAsText(file);
    }
  };

  React.useEffect(() => {
    if (isOpen && files.length > 0) {
      generateCSV();
    }
  }, [isOpen, files]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Edit Files</h2>
              <p className="text-sm text-gray-600">{files.length} files selected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('edit')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'edit'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Edit CSV
              </button>
              <button
                onClick={() => setMode('import')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'import'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Import CSV
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload CSV</span>
              </label>

              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Format Instructions</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use semicolons (;) to separate multiple keywords, Adobe keys, or tags</li>
              <li>• Keep the ID column unchanged to match files correctly</li>
              <li>• Adobe Category must be one of the predefined categories</li>
              <li>• Empty cells will clear the corresponding field</li>
            </ul>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* CSV Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                CSV Data
              </label>
              <span className="text-xs text-gray-500">
                {csvData.split('\n').length - 1} rows
              </span>
            </div>
            
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="CSV data will appear here..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          {mode === 'import' && (
            <button
              onClick={handleSave}
              disabled={errors.length > 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Apply Changes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;