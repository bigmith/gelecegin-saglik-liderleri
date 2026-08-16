import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://saglikliderleri.markamutfagi.co',
  'https://gelecegin-saglik-liderleri.omerkarapinar.workers.dev',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function jsonRes(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  })
}

function str2ab(str: string): Uint8Array {
  const buf = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i)
  }
  return buf
}

function base64url(arr: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i])
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function strToBase64url(str: string): string {
  return base64url(new TextEncoder().encode(str))
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const pemContents = pem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')

  const binaryDerString = atob(pemContents)
  const binaryDer = str2ab(binaryDerString)

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )
}

async function getGoogleAccessToken(saJson: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claimSet = {
    iss: saJson.client_email,
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = strToBase64url(JSON.stringify(header))
  const encodedClaim = strToBase64url(JSON.stringify(claimSet))
  const unsignedToken = `${encodedHeader}.${encodedClaim}`

  const privateKey = await importPrivateKey(saJson.private_key)
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  )

  const signature = base64url(new Uint8Array(signatureBuffer))
  const jwtAssertion = `${unsignedToken}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtAssertion,
    }),
  })

  const tokenData = await tokenRes.json()
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Google OAuth token alınamadı: ${tokenData.error_description || tokenData.error || 'Bilinmeyen hata'}`)
  }

  return tokenData.access_token
}

// Get or Create subfolder for a participant
async function getOrCreateParticipantFolder(googleToken: string, rootFolderId: string, folderName: string): Promise<string> {
  const safeName = folderName.replace(/'/g, "\\'")
  const query = `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false and name='${safeName}'`
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&supportsAllDrives=true&includeItemsFromAllDrives=true`

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${googleToken}` }
  })

  if (searchRes.ok) {
    const searchData = await searchRes.json()
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id
    }
  }

  // Create folder if not found
  const createUrl = 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true'
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${googleToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId]
    })
  })

  const createData = await createRes.json()
  if (!createRes.ok || !createData.id) {
    throw new Error(`Katılımcı klasörü oluşturulamadı: ${createData.error?.message || 'Bilinmeyen hata'}`)
  }

  return createData.id
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') || ''
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ ok: false, error: 'CORS yetkisi reddedildi.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const { action, payload } = await req.json()

    if (action !== 'list_delivery_files' && action !== 'clean_delivery_files') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return jsonRes(req, { ok: false, error: 'Yetkilendirme başlığı eksik.' }, 401)

      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user }, error: userError } = await userClient.auth.getUser()
      if (userError || !user) return jsonRes(req, { ok: false, error: 'Oturum doğrulanamadı.' }, 401)
    }

    const saJsonRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    const rootFolderId = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID')
    const sharedDriveId = Deno.env.get('GOOGLE_DRIVE_SHARED_DRIVE_ID')

    if (!saJsonRaw || !rootFolderId) {
      return jsonRes(req, { ok: false, error: 'Google Drive konfigürasyonu (Secrets) eksik.' }, 500)
    }

    const saJson = JSON.parse(saJsonRaw)
    const googleToken = await getGoogleAccessToken(saJson)

    if (action === 'test_connection') {
      const driveUrl = `https://www.googleapis.com/drive/v3/files/${rootFolderId}?fields=id,name,mimeType,driveId&supportsAllDrives=true`
      const res = await fetch(driveUrl, {
        headers: { Authorization: `Bearer ${googleToken}` }
      })
      const data = await res.json()
      if (!res.ok) {
        return jsonRes(req, { ok: false, error: `Drive erişim hatası: ${data.error?.message || 'Bilinmeyen hata'}` }, res.status)
      }
      return jsonRes(req, { ok: true, data: { status: 'CONNECTED', root_folder: data, shared_drive_id: sharedDriveId || null } })
    }

    if (action === 'upload_file') {
      const { filename, file_base64, content_type, katilimci_adi, katilimci_id, user_email } = payload
      if (!filename || !file_base64) {
        return jsonRes(req, { ok: false, error: 'filename ve file_base64 zorunludur.' }, 400)
      }

      // Determine parent folder: create or get participant subfolder
      let targetParentId = rootFolderId
      if (katilimci_adi || katilimci_id) {
        const folderName = katilimci_adi ? `${katilimci_adi} (ID ${katilimci_id || ''})`.trim() : `Katılımcı #${katilimci_id}`
        targetParentId = await getOrCreateParticipantFolder(googleToken, rootFolderId, folderName)
      }

      const mime = content_type || 'application/octet-stream'
      const cleanBase64 = file_base64.replace(/^data:[^;]+;base64,/, '')

      // Multipart upload payload
      const metadata = {
        name: filename,
        parents: [targetParentId],
        mimeType: mime,
      }

      const boundary = '-------314159265358979323846'
      const delimiter = `\r\n--${boundary}\r\n`
      const closeDelimiter = `\r\n--${boundary}--`

      let multipartRequestBody = ''
      multipartRequestBody += delimiter
      multipartRequestBody += 'Content-Type: application/json; charset=UTF-8\r\n\r\n'
      multipartRequestBody += JSON.stringify(metadata)
      multipartRequestBody += delimiter
      multipartRequestBody += `Content-Type: ${mime}\r\n`
      multipartRequestBody += 'Content-Transfer-Encoding: base64\r\n\r\n'
      multipartRequestBody += cleanBase64
      multipartRequestBody += closeDelimiter

      const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink'
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      })

      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        return jsonRes(req, { ok: false, error: `Google Drive yükleme hatası: ${uploadData.error?.message || 'Bilinmeyen yükleme hatası'}` }, uploadRes.status)
      }

      const fileId = uploadData.id

      // Set reader permission on uploaded file
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        })
      } catch (e) {
        console.warn('Permission grant warning:', e)
      }

      const webViewLink = uploadData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
      const webContentLink = uploadData.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`

      return jsonRes(req, {
        ok: true,
        data: {
          file_id: fileId,
          filename: uploadData.name,
          parent_folder_id: targetParentId,
          webViewLink,
          webContentLink,
          download_url: webContentLink
        }
      })
    }

    if (action === 'list_delivery_files') {
      const query = `'${rootFolderId}' in parents and trashed=false`
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType)`

      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${googleToken}` }
      })

      if (!searchRes.ok) {
        const errData = await searchRes.json()
        return jsonRes(req, { ok: false, error: `Drive query error: ${errData.error?.message || 'Bilinmeyen hata'}` }, 500)
      }

      const searchData = await searchRes.json()
      const items = searchData.files || []

      let foldersCount = 0
      let filesCount = 0

      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          foldersCount++
        } else {
          filesCount++
        }
      }

      return jsonRes(req, {
        ok: true,
        data: {
          root_folder_id: rootFolderId,
          participant_folders_found: foldersCount,
          files_found: filesCount,
          total_items_in_root: items.length
        }
      })
    }

    if (action === 'clean_delivery_files') {
      const query = `'${rootFolderId}' in parents and trashed=false`
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType)`

      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${googleToken}` }
      })

      if (!searchRes.ok) {
        const errData = await searchRes.json()
        return jsonRes(req, { ok: false, error: `Drive query error: ${errData.error?.message || 'Bilinmeyen hata'}` }, 500)
      }

      const searchData = await searchRes.json()
      const items = searchData.files || []

      let trashedFolders = 0
      let trashedFiles = 0

      for (const item of items) {
        const patchRes = await fetch(`https://www.googleapis.com/drive/v3/files/${item.id}?supportsAllDrives=true`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ trashed: true })
        })

        if (patchRes.ok) {
          if (item.mimeType === 'application/vnd.google-apps.folder') {
            trashedFolders++
          } else {
            trashedFiles++
          }
        }
      }

      return jsonRes(req, {
        ok: true,
        data: {
          root_folder_id: rootFolderId,
          participant_folders_trashed: trashedFolders,
          files_trashed: trashedFiles,
          total_items_trashed: trashedFolders + trashedFiles
        }
      })
    }

    return jsonRes(req, { ok: false, error: 'Bilinmeyen action: ' + action }, 400)

  } catch (err: any) {
    console.error('google-drive-action error:', err)
    return jsonRes(req, { ok: false, error: err.message || 'Sunucu hatası oluştu.' }, 500)
  }
})
