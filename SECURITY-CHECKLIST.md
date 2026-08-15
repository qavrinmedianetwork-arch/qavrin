# QAVRIN Security Checklist

Before public launch:

- [ ] Supabase Auth enabled
- [ ] Email verification enabled
- [ ] Password reset tested
- [ ] No service_role key in frontend
- [ ] RLS enabled on every public table
- [ ] User can modify only their own profile
- [ ] User can modify/delete only their own posts
- [ ] Saved posts are private
- [ ] Notifications are private
- [ ] Reports are private to reporter/moderators
- [ ] Rate limiting / abuse protection
- [ ] CAPTCHA or equivalent for suspicious signup activity
- [ ] Block and report tools
- [ ] Moderation queue
- [ ] Account deletion
- [ ] Data export plan
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Community guidelines
- [ ] Error monitoring
- [ ] Database backups
- [ ] Dependency updates
- [ ] Accessibility audit
- [ ] Mobile browser testing
- [ ] XSS / injection testing
- [ ] Permission testing with two separate accounts
