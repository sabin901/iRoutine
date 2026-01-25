# Security Documentation

## 🔒 Authentication & Authorization

### Authentication Method

**Supabase Auth (JWT-based)**
- Email/password authentication
- JWT tokens issued by Supabase
- Tokens validated on every API request
- Tokens expire after configured time (default: 1 hour)
- Refresh tokens for session management

### Authorization

**Row Level Security (RLS)**
- All database tables enforce RLS policies
- Users can only access their own data (`user_id` filter)
- Policies verified at database level, not just application level
- No user can read another user's activities, interruptions, or insights

**API Endpoint Protection**
- All endpoints require Bearer token authentication
- Unauthenticated requests return `401 Unauthorized`
- Token validation happens before any data access
- User ID extracted from JWT and used for all queries

---

## 🛡️ Threat Model

### Identified Threats

1. **Unauthorized Data Access**
   - **Threat**: User A accessing User B's data
   - **Mitigation**: RLS policies + JWT validation + user_id filtering

2. **Rate Limiting Abuse**
   - **Threat**: DDoS or brute force attacks
   - **Mitigation**: IP and user-based rate limiting (100/min read, 30/min write)

3. **Input Injection**
   - **Threat**: SQL injection, XSS, command injection
   - **Mitigation**: Pydantic validation, parameterized queries, input sanitization

4. **API Key Exposure**
   - **Threat**: Hardcoded keys in client code
   - **Mitigation**: Environment variables only, no keys in frontend code

5. **Man-in-the-Middle**
   - **Threat**: Intercepted API requests
   - **Mitigation**: HTTPS required in production, secure cookies

6. **Session Hijacking**
   - **Threat**: Stolen JWT tokens
   - **Mitigation**: Short token expiration, refresh token rotation

---

## 🔐 Input Validation & Sanitization

### Server-Side Validation (Pydantic)

**Schema-Based Validation**
- All inputs validated against Pydantic models
- Type checking (datetime, string, enum)
- Length limits enforced (notes: 1000 chars, interruption notes: 500 chars)
- Unexpected fields rejected (`extra = "forbid"`)

**Business Logic Validation**
- End time must be after start time
- Activity duration max 24 hours
- Category must be from allowed list
- Interruption type must be from allowed list

**Input Sanitization**
- String fields trimmed of whitespace
- No script tags or dangerous content
- SQL injection prevented via parameterized queries (Supabase client)

### Client-Side Validation (TypeScript)

- TypeScript types enforce structure
- Form validation before submission
- UI prevents invalid inputs

**Note**: Client-side validation is for UX only. Server-side validation is the security boundary.

---

## 🔑 API Key Handling

### Environment Variables

**Backend (Server-Side Only)**
- `SUPABASE_SERVICE_ROLE_KEY` - Never exposed to client
- `SUPABASE_URL` - Public, safe to expose
- `SUPABASE_ANON_KEY` - Public, safe to expose (limited permissions via RLS)

**Frontend (Public Keys Only)**
- `NEXT_PUBLIC_SUPABASE_URL` - Public URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (RLS enforced)
- `NEXT_PUBLIC_API_URL` - Backend API URL

**Security Practices**
- ✅ No hardcoded keys in code
- ✅ All keys in environment variables
- ✅ `.env` files in `.gitignore`
- ✅ `.env.example` provided as template
- ✅ Service role key never in frontend
- ⚠️ Key rotation recommended quarterly
- ⚠️ Monitor for exposed keys in logs/errors

### OWASP Best Practices

- ✅ Use environment variables for all secrets
- ✅ Never log sensitive keys
- ✅ Rotate keys periodically
- ✅ Use least privilege (anon key for client, service role for backend)
- ✅ Monitor for key exposure
- ✅ Clear comments explaining key usage

---

## 🚦 Rate Limiting

### Implementation

**IP-Based Rate Limiting**
- All endpoints rate limited by IP address
- Uses `slowapi` library
- Graceful 429 (Too Many Requests) responses

**Rate Limits**
- **Read endpoints** (GET): 100 requests/minute
- **Write endpoints** (POST/PUT/DELETE): 30 requests/minute
- **Health check**: 100 requests/minute

**Response Format**
```json
{
  "detail": "Rate limit exceeded: 30 per 1 minute"
}
```

**Future Enhancement**
- User-based rate limiting (by user_id from JWT)
- Different limits for authenticated vs anonymous
- Rate limit headers in response

---

## 🔒 Data Protection

### What We Store

**User Data**
- Email (hashed by Supabase Auth)
- User ID (UUID)
- Timezone preference
- Activities (category, times, notes)
- Interruptions (type, time, notes)

**What We Don't Store**
- ❌ Passwords (handled by Supabase Auth)
- ❌ Credit card information
- ❌ Personal identification numbers
- ❌ Location data
- ❌ Browser fingerprints
- ❌ IP addresses (except for rate limiting, not stored)

### Privacy

- All data belongs to the user
- No data sharing with third parties
- No analytics tracking
- Data export available to user
- Data deletion on account deletion (via Supabase)

---

## 🛡️ Error Handling

### Security-Focused Error Messages

**Generic User Messages**
- "An error occurred" (not internal details)
- "Invalid authentication" (not "token expired" or "invalid signature")
- "Failed to create activity" (not database errors)

**Server-Side Logging**
- Detailed errors logged server-side only
- No sensitive data in error responses
- Error tracking (optional: Sentry) for debugging

**Error Codes**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (authorization failed)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error (generic)

---

## ✅ Security Checklist

### Authentication & Authorization
- [x] JWT authentication implemented
- [x] RLS policies on all tables
- [x] User ID filtering on all queries
- [x] Unauthenticated requests rejected

### Input Validation
- [x] Pydantic schema validation
- [x] Type checking
- [x] Length limits
- [x] Unexpected fields rejected
- [x] Business logic validation
- [x] Input sanitization

### API Security
- [x] Rate limiting implemented
- [x] CORS configured
- [x] HTTPS required in production
- [x] Request size limits (via FastAPI)

### Key Management
- [x] No hardcoded keys
- [x] Environment variables only
- [x] Service role key server-side only
- [x] .env in .gitignore

### Error Handling
- [x] Generic error messages
- [x] No sensitive data in responses
- [x] Server-side logging

### Data Protection
- [x] RLS policies enforced
- [x] User data isolation
- [x] No unnecessary data collection

---

## 🔄 Security Maintenance

### Regular Tasks

1. **Key Rotation** (Quarterly)
   - Rotate Supabase service role key
   - Update environment variables
   - Test all endpoints

2. **Dependency Updates** (Monthly)
   - Update FastAPI, Pydantic, Supabase client
   - Check for security advisories
   - Test after updates

3. **Security Audit** (Quarterly)
   - Review RLS policies
   - Check for exposed keys
   - Review error messages
   - Test rate limiting

4. **Monitoring** (Ongoing)
   - Monitor for unusual API usage
   - Check error logs
   - Review authentication failures

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Pydantic Validation](https://docs.pydantic.dev/latest/concepts/validators/)

---

**Security is an ongoing process. Regular audits and updates are essential.**
