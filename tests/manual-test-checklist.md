# Manual Testing Checklist for Helper for Jane

## 🚀 Pre-Testing Setup

### Required Services
- [ ] Redis server running on port 6379
- [ ] Backend server running on port 3001
- [ ] Frontend server running on port 5173
- [ ] OpenAI API key configured (optional for full testing)

### Environment Setup
- [ ] All environment variables configured
- [ ] Database initialized
- [ ] Upload directories created
- [ ] Log directories created

## 🔐 Authentication Tests

### User Registration
- [ ] Register with valid email and password
- [ ] Try registering with existing email (should fail)
- [ ] Try registering with invalid email format (should fail)
- [ ] Try registering with weak password (should fail)
- [ ] Verify user receives proper feedback

### User Login
- [ ] Login with valid credentials
- [ ] Try login with invalid email (should fail)
- [ ] Try login with wrong password (should fail)
- [ ] Verify proper error messages
- [ ] Verify successful login redirects to dashboard

### Session Management
- [ ] Verify user stays logged in on page refresh
- [ ] Test logout functionality
- [ ] Verify protected routes require authentication

## 📁 Project Management Tests

### Project Creation
- [ ] Create project with all required fields
- [ ] Try creating project with missing name (should fail)
- [ ] Test different project categories
- [ ] Test local vs Yandex storage options
- [ ] Verify project appears in projects list

### Project Operations
- [ ] View project details
- [ ] Edit project information
- [ ] Delete project (with confirmation)
- [ ] Verify project statistics update correctly

## 📤 File Upload Tests

### Basic Upload
- [ ] Upload single image file
- [ ] Upload multiple image files
- [ ] Try uploading non-image file (should fail)
- [ ] Try uploading oversized file (should fail)
- [ ] Verify upload progress indication

### File Formats
- [ ] Test JPG files
- [ ] Test PNG files
- [ ] Test WebP files
- [ ] Test HEIC files (if supported)
- [ ] Verify thumbnails are generated

### Upload Validation
- [ ] Test file size limits
- [ ] Test file type validation
- [ ] Verify error messages for invalid files
- [ ] Test drag and drop functionality

## 🤖 AI Processing Tests

### Queue Management
- [ ] Verify files are added to queue after upload
- [ ] Check queue status updates in real-time
- [ ] Test pause/resume queue functionality
- [ ] Test retry failed files

### Processing Results
- [ ] Verify AI descriptions are generated
- [ ] Check keywords extraction
- [ ] Verify processing time is recorded
- [ ] Test error handling for failed processing

## 📝 Template Management Tests

### Template Creation
- [ ] Create new template with variables
- [ ] Test template preview functionality
- [ ] Verify variable substitution works
- [ ] Test template categories

### Template Operations
- [ ] Edit existing template
- [ ] Copy template
- [ ] Delete template
- [ ] Set default template

## 🔍 Search and Filter Tests

### Basic Search
- [ ] Search by filename
- [ ] Search by description
- [ ] Search by keywords
- [ ] Test search suggestions

### Advanced Filters
- [ ] Filter by status (completed, processing, error)
- [ ] Filter by date range
- [ ] Filter by Adobe categories
- [ ] Filter by tags
- [ ] Combine multiple filters

### Bulk Operations
- [ ] Select multiple files
- [ ] Bulk edit file metadata
- [ ] Bulk reprocess files
- [ ] Bulk delete files
- [ ] Bulk tag assignment

## 📊 Import/Export Tests

### Export Functionality
- [ ] Export single project as JSON
- [ ] Export single project as CSV
- [ ] Export all projects
- [ ] Export settings only
- [ ] Export templates only

### Import Functionality
- [ ] Import project from JSON
- [ ] Import files from CSV
- [ ] Import settings
- [ ] Import templates
- [ ] Verify data integrity after import

## 🔔 Notification Tests

### System Notifications
- [ ] Verify toast notifications appear
- [ ] Test notification center
- [ ] Check notification filtering
- [ ] Test mark as read functionality

### Telegram Integration (if configured)
- [ ] Test Telegram bot connection
- [ ] Verify notifications are sent
- [ ] Test different notification types

## 📱 UI/UX Tests

### Responsive Design
- [ ] Test on mobile devices (375px width)
- [ ] Test on tablets (768px width)
- [ ] Test on desktop (1280px+ width)
- [ ] Verify all functionality works on all sizes

### Accessibility
- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility
- [ ] Check color contrast ratios
- [ ] Test with browser zoom (150%, 200%)

### Performance
- [ ] Check page load times
- [ ] Verify smooth scrolling with large file lists
- [ ] Test with slow network connection
- [ ] Monitor memory usage

## ⚙️ Settings Tests

### API Configuration
- [ ] Test OpenAI API key validation
- [ ] Verify model selection works
- [ ] Test token limit settings
- [ ] Test temperature settings

### Storage Settings
- [ ] Test Yandex Disk integration
- [ ] Verify file size limits
- [ ] Test allowed file formats
- [ ] Test thumbnail size settings

### Queue Settings
- [ ] Test concurrent processing limits
- [ ] Verify retry configuration
- [ ] Test timeout settings
- [ ] Check queue interval settings

## 🔒 Security Tests

### Input Validation
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts
- [ ] Verify file upload security
- [ ] Test API rate limiting

### Authentication Security
- [ ] Test JWT token expiration
- [ ] Verify password hashing
- [ ] Test session security
- [ ] Check CORS configuration

## 🚨 Error Handling Tests

### Network Errors
- [ ] Test with backend offline
- [ ] Test with slow network
- [ ] Test with intermittent connectivity
- [ ] Verify proper error messages

### API Errors
- [ ] Test with invalid API keys
- [ ] Test with API rate limits exceeded
- [ ] Test with malformed requests
- [ ] Verify error recovery

### File Processing Errors
- [ ] Test with corrupted image files
- [ ] Test with unsupported formats
- [ ] Test with extremely large files
- [ ] Verify error logging

## 📈 Monitoring Tests

### System Health
- [ ] Check health endpoint
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Check disk space usage

### Queue Monitoring
- [ ] Verify queue statistics accuracy
- [ ] Check processing time metrics
- [ ] Monitor error rates
- [ ] Test queue cleanup

### Activity Logging
- [ ] Verify user actions are logged
- [ ] Check system events logging
- [ ] Test log rotation
- [ ] Verify log security

## ✅ Final Verification

### Data Integrity
- [ ] Verify all uploaded files are accessible
- [ ] Check database consistency
- [ ] Verify backup/restore functionality
- [ ] Test data migration

### Production Readiness
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance meets requirements
- [ ] Security measures in place
- [ ] Documentation complete

## 📋 Test Results Summary

| Test Category | Status | Notes |
|---------------|--------|-------|
| Authentication | ⏳ | |
| Project Management | ⏳ | |
| File Upload | ⏳ | |
| AI Processing | ⏳ | |
| Templates | ⏳ | |
| Search/Filter | ⏳ | |
| Import/Export | ⏳ | |
| Notifications | ⏳ | |
| UI/UX | ⏳ | |
| Settings | ⏳ | |
| Security | ⏳ | |
| Error Handling | ⏳ | |
| Monitoring | ⏳ | |

**Legend:** ✅ Pass | ❌ Fail | ⏳ Pending | ⚠️ Warning

## 🎯 Overall Status: ⏳ Testing in Progress

**Tested by:** ________________  
**Date:** ________________  
**Version:** 1.0.0  
**Environment:** ________________