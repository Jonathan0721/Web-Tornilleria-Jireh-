'use client'

import { useState } from 'react'

export function ProductImageField({ initialUrl = '' }: { initialUrl?: string }) {
  const [imageUrl, setImageUrl] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function uploadImage(file: File) {
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.set('file', file)
      const response = await fetch('/api/admin/product-image', { method: 'POST', body: formData })
      const result = await response.json() as { url?: string; error?: string }
      if (!response.ok || !result.url) {
        throw new Error(result.error || 'No se pudo subir la imagen.')
      }
      setImageUrl(result.url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <label className="block text-sm">
        Imagen del producto
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) void uploadImage(file)
            event.currentTarget.value = ''
          }}
          className="mt-1 block w-full rounded-md border border-input bg-background p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-2"
        />
      </label>
      <input type="hidden" name="imagen" value={imageUrl} />
      <input type="hidden" name="imagenSubiendo" value={uploading ? 'si' : ''} />
      <label className="block text-xs text-muted-foreground">
        O pega una URL de imagen
        <input
          type="url"
          value={imageUrl.startsWith('data:') ? '' : imageUrl}
          onChange={(event) => setImageUrl(event.currentTarget.value)}
          className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
          placeholder="https://..."
        />
      </label>
      {uploading && <p className="text-xs text-muted-foreground">Subiendo imagen...</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {imageUrl && (
        <div className="flex items-center gap-3">
          <img src={imageUrl} alt="Vista previa del producto" className="size-20 rounded border border-border bg-muted object-contain" />
          <button type="button" onClick={() => setImageUrl('')} className="text-xs text-destructive hover:underline">Quitar imagen</button>
        </div>
      )}
    </div>
  )
}
