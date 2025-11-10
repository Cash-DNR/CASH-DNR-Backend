## FILE UPLOAD CONFLICT FIX

### Problem:
The error "Unexpected end of form" was caused by **TWO file upload middlewares** trying to process the same request:

1. **`express-fileupload`** - Applied globally to `/api/auth/register-with-documents`
2. **`multer`** - Applied in the route handler for the same endpoint

Both middlewares were trying to parse the multipart form data stream simultaneously, causing one to consume the stream before the other could finish, resulting in "Unexpected end of form" error.

### Solution:
Removed the `express-fileupload` middleware from `/api/auth/register-with-documents` route since it already uses `multer` for file handling.

### Changes Made:
**File**: `src/server.js`
- Removed line: `app.use('/api/auth/register-with-documents', fileUpload(fileUploadConfig));`
- Added comment explaining why this route doesn't use express-fileupload

### Result:
- ✅ Only `multer` now handles `/api/auth/register-with-documents`
- ✅ `express-fileupload` continues to handle `/api/upload` routes
- ✅ No more middleware conflicts
- ✅ File uploads should now work correctly

### Test:
After deploying, try uploading files again to `/api/auth/register-with-documents`. The "Unexpected end of form" error should be resolved.