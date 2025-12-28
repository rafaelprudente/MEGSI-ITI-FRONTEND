import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Download, Trash2, RefreshCw, ArrowUpDown } from 'lucide-react'
import Navbar from '../components/Navbar'
import { fileService, FileMetadata } from '../lib/files'

type SortField = 'originalName' | 'size' | 'createAt'
type SortDirection = 'asc' | 'desc'

export default function Files() {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('createAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const { data: files, isLoading, error } = useQuery<FileMetadata[]>({
    queryKey: ['files'],
    queryFn: fileService.listFiles,
  })

  const uploadMutation = useMutation({
    mutationFn: fileService.uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      setSelectedFile(null)
      setUploadProgress(false)
    },
    onError: () => {
      setUploadProgress(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      console.log('🗑️ Deleting files:', fileIds)
      const results = await Promise.allSettled(fileIds.map(id => fileService.deleteFile(id)))
      
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        console.error('❌ Failed to delete some files:', failed)
        throw new Error(`Failed to delete ${failed.length} file(s)`)
      }
      
      console.log('✅ All files deleted successfully')
      return results
    },
    onSuccess: () => {
      console.log('🔄 Invalidating queries...')
      queryClient.invalidateQueries({ queryKey: ['files'] })
      setSelectedFiles(new Set())
      console.log('✅ Deletion complete, queries invalidated')
    },
    onError: (error) => {
      console.error('❌ Delete mutation error:', error)
      alert('Erro ao eliminar ficheiros. Por favor tente novamente.')
    },
  })

  // Sort and filter files
  const sortedFiles = useMemo(() => {
    if (!files) return []
    
    return [...files].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'originalName':
          comparison = a.originalName.localeCompare(b.originalName)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'createAt':
          const dateA = a.createAt ? new Date(a.createAt).getTime() : 0
          const dateB = b.createAt ? new Date(b.createAt).getTime() : 0
          comparison = dateA - dateB
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [files, sortField, sortDirection])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedFiles.size === files?.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files?.map(f => f.id) || []))
    }
  }

  const toggleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      setUploadProgress(true)
      uploadMutation.mutate(selectedFile)
    }
  }

  const handleDownload = async (file: FileMetadata) => {
    try {
      const blob = await fileService.downloadFile(file.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.originalName.split('/').pop() || 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleDeleteSelected = () => {
    const count = selectedFiles.size
    if (count === 0) {
      console.log('⚠️ No files selected')
      return
    }
    
    console.log(`📍 Selected ${count} file(s) for deletion`)
    const fileIds = Array.from(selectedFiles)
    console.log('📍 File IDs:', fileIds)
    
    if (confirm(`Tem a certeza que quer eliminar ${count} ficheiro(s)?`)) {
      console.log('✅ User confirmed deletion')
      deleteMutation.mutate(fileIds)
    } else {
      console.log('🧹 User cancelled deletion')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestão de Ficheiros</h2>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Enviar Ficheiro</h3>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
              />
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadProgress}
                className="btn btn-primary flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadProgress ? 'A enviar...' : 'Enviar'}
              </button>
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selecionado: {selectedFile.name} ({fileService.formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-700">Os Seus Ficheiros</h3>
              {selectedFiles.size > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedFiles.size} selecionado(s)
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              {selectedFiles.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleteMutation.isPending}
                  className="btn btn-danger flex items-center text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Selecionados
                </button>
              )}
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['files'] })}
                className="btn btn-secondary flex items-center text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-8 text-gray-500">A carregar ficheiros...</div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              Erro ao carregar ficheiros. Por favor tente novamente.
            </div>
          )}

          {sortedFiles && sortedFiles.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Ainda não foram enviados ficheiros. Envie o seu primeiro ficheiro acima!
            </div>
          )}

          {sortedFiles && sortedFiles.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedFiles.size === files?.length && files.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('originalName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Nome do Ficheiro</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('size')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Tamanho</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('createAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Data</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedFiles.map((file) => (
                    <tr 
                      key={file.id} 
                      className={`hover:bg-gray-50 ${selectedFiles.has(file.id) ? 'bg-primary-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => toggleSelectFile(file.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {file.originalName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fileService.formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.createAt ? fileService.formatDate(file.createAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDownload(file)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Download"
                        >
                          <Download className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
