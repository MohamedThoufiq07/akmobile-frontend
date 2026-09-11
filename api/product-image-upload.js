import { handleUpload } from '@vercel/blob/client';
import crypto from 'crypto';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed. Use POST.',
    });
  }

  const body = request.body;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!clientPayload) {
          throw new Error('Upload grant payload is required.');
        }

        let parsedPayload;
        try {
          parsedPayload = typeof clientPayload === 'string' ? JSON.parse(clientPayload) : clientPayload;
        } catch {
          throw new Error('Malformed client payload JSON.');
        }

        const { grant, stagedItemId } = parsedPayload;
        if (!grant || !stagedItemId) {
          throw new Error('Missing upload grant or stagedItemId.');
        }

        const parts = grant.split('.');
        if (parts.length !== 2) {
          throw new Error('Invalid upload grant token format.');
        }

        const [payloadB64, signature] = parts;
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN || '';
        const secret = process.env.UPLOAD_GRANT_SECRET || blobToken || process.env.DJANGO_SECRET_KEY || '';

        if (!secret) {
          throw new Error('Storage secret configuration missing on server.');
        }

        const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
        const expectedBuf = Buffer.from(expectedSig, 'utf8');
        const actualBuf = Buffer.from(signature, 'utf8');

        if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
          throw new Error('Upload grant signature verification failed.');
        }

        let grantData;
        try {
          const rawJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
          grantData = JSON.parse(rawJson);
        } catch {
          throw new Error('Failed to parse upload grant data.');
        }

        const now = Math.floor(Date.now() / 1000);
        if (!grantData.exp || grantData.exp < now) {
          throw new Error('Upload grant has expired.');
        }

        if (!grantData.is_staff) {
          throw new Error('Unauthorized: Admin privileges required.');
        }

        if (grantData.staged_item_id !== stagedItemId) {
          throw new Error('Grant staged item ID mismatch.');
        }

        if (!pathname.startsWith('products/')) {
          throw new Error('Invalid storage pathname. Must begin with products/.');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            stagedItemId: grantData.staged_item_id,
            sessionToken: grantData.session_token,
            userId: grantData.user_id,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Authoritative verification and permanent promotion is performed by Django finalize-upload
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({
      code: 'UPLOAD_AUTHORIZATION_FAILED',
      message: error.message || 'Upload authorization failed.',
    });
  }
}
