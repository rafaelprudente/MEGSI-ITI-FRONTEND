import api from './api'

export interface FileMetadata {
  id: string
  originalName: string
  size: number
  createAt: string | null
  userId: string | null
  mimeType: string | null
  version: number
}

export const fileService = {
  async listFiles(): Promise<FileMetadata[]> {
    const response = await api.get<FileMetadata[]>('/files')
    return response.data
  },

  async uploadFile(file: File): Promise<FileMetadata> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<FileMetadata>('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await api.get(`/files/${fileId}`, {
      responseType: 'blob',
    })
    return response.data
  },

  async deleteFile(fileId: string): Promise<void> {
    console.log(`🗑️ Deleting file: ${fileId}`)
    try {
      const response = await api.delete(`/files/${fileId}`)
      console.log(`✅ File ${fileId} deleted, status:`, response.status)
    } catch (error: any) {
      console.error(`❌ Failed to delete file ${fileId}:`, error.response?.status, error.response?.data)
      throw error
    }
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  },

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-PT')
  },
}
