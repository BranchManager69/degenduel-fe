# Complete Authentication Endpoints Reference

## 1. Passkey Authentication Endpoints (Fully Working)

Passkeys work perfectly! They're the most seamless option for cross-device auth within the same ecosystem (Apple/Google). They're just slightly more complex to implement on the frontend.

### Registration Endpoints

**POST** `/api/auth/biometric/register-options`
*Body:*
```json
{
  "nickname?": "string",
  "authenticatorType?": "string" // 'platform' recommended for passkeys
}
```
*Response:* WebAuthn credential creation options

**POST** `/api/auth/biometric/register-verify`
*Body:*
```json
{
  "id": "string",
  "rawId": "string",
  "response": {
    "clientDataJSON": "string",
    "attestationObject": "string"
  },
  "type": "string",
  "deviceName?": "string",
  "deviceType?": "string"
}
```
*Response:*
```json
{
  "success": true,
  "credentialId": "string"
}
```

### Authentication Endpoints

**POST** `/api/auth/biometric/auth-options`
*Body:*
```json
{
  "userId": "number" // User ID if known
}
```
*Response:* WebAuthn authentication options

**POST** `/api/auth/biometric/auth-verify`
*Body:*
```json
{
  "id": "string",
  "rawId": "string",
  "response": {
    "clientDataJSON": "string",
    "authenticatorData": "string",
    "signature": "string",
    "userHandle?": "string"
  },
  "type": "string"
}
```
*Response:*
```json
{
  "verified": true,
  "user": {
    "id": "number",
    "wallet_address": "string",
    "role": "string",
    "nickname": "string"
  },
  "auth_method": "biometric"
}
```

### Management Endpoints

**GET** `/api/auth/biometric/credentials`
*Response:*
```json
{
  "credentials": [
    {
      "id": "string",
      "name": "string",
      "created_at": "string",
      "last_used": "string",
      "device_type": "string"
    }
  ]
}
```

**DELETE** `/api/auth/biometric/credentials/:id`
*Response:*
```json
{
  "success": true,
  "message": "string"
}
```

## 2. QR Code Authentication Endpoints

### Generation Endpoint

**POST** `/api/auth/qr/generate`
*Response:*
```json
{
  "qrCode": "string", // data URL of QR code
  "sessionToken": "string",
  "expiresAt": "string"
}
```

### Verification Endpoint (Called by Mobile)

**POST** `/api/auth/qr/verify/:token`
*Headers:* `Authorization: Bearer <mobile_device_token>`
*Response:*
```json
{
  "success": true,
  "message": "string"
}
```

### Status Polling Endpoint (Called by Desktop)

**GET** `/api/auth/qr/poll/:token`
*Response:*
```json
{
  "status": "string", // 'pending', 'approved', 'completed', 'cancelled'
  "expiresAt": "string"
}
```

### Complete Authentication Endpoint (Called by Desktop)

**POST** `/api/auth/qr/complete/:token`
*Response:*
```json
{
  "verified": true,
  "user": {
    "id": "number",
    "wallet_address": "string",
    "role": "string",
    "nickname": "string"
  },
  "auth_method": "qr_code"
}
```

### Cancel Endpoint

**POST** `/api/auth/qr/cancel/:token`
*Response:*
```json
{
  "success": true,
  "message": "string"
}
```

## Implementation Priority

Both methods are fully implemented and working. The choice of which to implement first depends on your audience:

1.  **Passkeys:** Better user experience within same ecosystem (iOS users stay on iOS), but slightly more complex to implement.
2.  **QR Codes:** Works universally across all devices with near-zero platform dependencies.

Most sites implement both, starting with the one that fits their user base best.