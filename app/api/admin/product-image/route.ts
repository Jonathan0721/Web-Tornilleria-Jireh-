import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(request: Request) {
  const session = await getAdminSession(request.headers)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado para subir imágenes.' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Falta configurar el almacenamiento de imágenes en el servidor.' }, { status: 503 })
  }
  if (!/^[a-z0-9_-]+$/.test(bucket)) {
    return NextResponse.json({ error: 'El bucket configurado tiene un nombre inválido.' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Selecciona una imagen para subir.' }, { status: 400 })
  }

  const extension = IMAGE_EXTENSIONS[file.type]
  if (!extension) {
    return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WebP.' }, { status: 415 })
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: 'La imagen debe pesar como máximo 5 MB.' }, { status: 413 })
  }

  const objectPath = `${randomUUID()}.${extension}`
  const baseUrl = supabaseUrl.replace(/\/+$/, '')
  const uploadResponse = await fetch(
    `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': file.type,
        'x-upsert': 'false',
      },
      body: await file.arrayBuffer(),
    },
  )

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text()
    console.error('Supabase Storage upload failed:', uploadResponse.status, detail)
    return NextResponse.json(
      { error: 'No se pudo guardar la imagen. Verifica que el bucket público product-images exista en Supabase Storage.' },
      { status: 502 },
    )
  }

  return NextResponse.json({
    url: `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`,
  })
}
