# QAVRIN Security Checklist

Before public launch:

- [ ] RLS enabled on every exposed table
- [ ] No service_role/secret key in GitHub
- [ ] Supabase Auth email confirmation configured
- [ ] Password reset tested
- [ ] Profile update cannot change is_admin
- [ ] User cannot edit another user's post
- [ ] User cannot delete another user's post
- [ ] User cannot delete another user's comment
- [ ] User cannot like as another user
- [ ] User cannot follow as another user
- [ ] Reports cannot be edited by ordinary users
- [ ] Admin accounts assigned outside normal profile editing
- [ ] Rate limiting / anti-spam added before public launch
- [ ] Blocked-user rules enforced before public launch
- [ ] Account deletion implemented
- [ ] Data export/deletion process documented
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Community guidelines published
- [ ] Abuse/report workflow staffed
- [ ] Monitoring and error reporting enabled
- [ ] Backups/recovery plan tested
- [ ] Accessibility review completed
- [ ] Mobile testing completed
- [ ] Load testing completed
