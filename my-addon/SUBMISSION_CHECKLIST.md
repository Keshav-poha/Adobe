Submission checklist for Adobe Express Add-on (Pixel Pluck)

- [ ] Unique add-on name (<=25 chars)
- [ ] Summary (<=50 chars) — included in `src/manifest.json` as `summary`
- [ ] Full description (<=1000 chars) — included in `src/manifest.json` as `description`
- [ ] Help URL — set `helpUrl` in `src/manifest.json`
- [ ] Support email — set `supportEmail` in `src/manifest.json`
- [ ] Privacy policy URL — set `privacyPolicyUrl` in `src/manifest.json`
- [ ] EULA/Terms URL — set `eulaUrl` in `src/manifest.json`
- [ ] 144x144 icon asset present (PNG/JPG) — `src/ui/assets/light-full-removebg-preview.png` (replace with exact 144x144 asset)
- [ ] At least 1 screenshot (1360x800) showing the add-on in use
- [ ] Release notes for this version
- [ ] Package size < 50 MB (packager enforces this)
- [ ] `manifest.json` at the zip root (packager creates `dist.zip` with manifest at root)
- [ ] Test private distribution link via Adobe Express Add-ons → Manage add-ons → Private link
- [ ] Confirm generative/AI usage notes and rights in description per Generative AI guidelines

Notes:
- Update the placeholder URLs and `supportEmail` before submitting.
- The Groq API key must be provided by users in Settings — do not include API keys in the package or in `.env` when distributing.
- Use the packaging script:

```bash
cd my-addon
npm run package
```

This creates `dist/dist.zip` ready to upload in the Adobe Express distribution flow.
