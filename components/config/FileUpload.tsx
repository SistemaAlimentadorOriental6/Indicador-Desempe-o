import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        onFileUpload(file);
      }
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  return (
    <div className="relative">
      <div 
        className={`
          relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 
          rounded-3xl shadow-xl border-2 transition-all duration-300 ease-out
          ${isDragOver 
            ? 'border-emerald-400 shadow-2xl scale-[1.02] bg-gradient-to-br from-emerald-50 to-emerald-100/50' 
            : 'border-emerald-200/60 hover:border-emerald-300/80 hover:shadow-2xl'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative p-12 text-center">
          <div className="mx-auto mb-8 relative">
            <div className={`
              w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500
              ${isUploading 
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 animate-pulse' 
                : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500'
              }
            `}>
              {isUploading ? (
                <div className="relative">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-white border-t-transparent"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border-2 border-white opacity-20"></div>
                </div>
              ) : (
                <FileSpreadsheet className="h-12 w-12 text-white drop-shadow-sm" />
              )}
            </div>
            {!isUploading && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <Upload className="h-4 w-4 text-emerald-600" />
              </div>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-2xl font-bold text-gray-800">
              {isUploading ? 'Procesando archivo...' : 'Cargar archivo Excel'}
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
              {isUploading 
                ? 'Analizando los datos de tu archivo Excel' 
                : 'Arrastra tu archivo aquí o haz clic para seleccionar'
              }
            </p>
          </div>

          {!isUploading && (
            <>
              <label className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <Upload className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                Seleccionar archivo
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Formatos: .xlsx, .xls
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Máximo 10MB
                </div>
              </div>
            </>
          )}

          {isUploading && (
            <div className="mt-6">
              <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;