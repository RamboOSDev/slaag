# Slaag — رخصتك بلغتك 🛞✔️

**Slaag. Your licence, your language.** Free static web app to practise the Belgian theory driving exam (B).
Live: https://ramboosdev.github.io/slaag/

> ⚠️ **v1 sample content, to be reviewed.** All lessons, questions and sign drawings are original and simplified. Always check the official *wegcode / code de la route*. / محتوى تجريبي — لازم يتراجع، وارجع دايماً لقانون السير الرسمي.

## Features / الميزات
- 🌐 UI language (Arabic RTL, English) + 📝 exam language (Dutch / French), translate toggle, 🔊 Dutch/French speech
- 📚 Lessons with key words · ▶ Practice with instant ✔/✖ feedback · 💡 explanation only on tap
- 🔁 One shared mistakes memory (practice, lesson quiz, mock exam): a mistake comes back (mixed into practice + "أخطائي") until answered right **3 times in a row in separate sessions**; counter in header
- 📝 Mock exam: 50 questions (or all available), 15 s each, wrong = −1, serious fault = −5, pass 41/50 (scaled)
- ⌨️ Laptop: ←/→, 1/2/3, Enter · 📱 Mobile: swipe + big bottom buttons · auto-advance after correct (☰ setting), stops after wrong, resumes where you left
- 📺 Stream mode: `?stream=1` (`&layout=v` for 9:16, `h` for 16:9), no personal data, logo + QR watermark, timer, reveal button (Space)
- Works offline after first visit (service worker). Progress stays in the browser (localStorage).

## Structure / الترتيب
```
index.html  css/style.css  js/app.js  js/icons.js (SVG icons + road signs)
data/questions.json  data/lessons.json  i18n/index.json  i18n/ar.json  i18n/en.json
img/logo.svg  img/qr.svg  manifest.json  sw.js
```

## Add a language / إضافة لغة
1. Copy `i18n/en.json` → `i18n/tr.json`, translate values, set `_name` (in its own script) and `_dir` (`ltr`/`rtl`).
2. Add `"tr"` to `i18n/index.json`.
3. Optional: add `"tr"` keys to `q`, `opts`, `explain` in `data/questions.json` and to `title`, `body`, `terms` in `data/lessons.json` (falls back to English).
4. Add the file to the list in `sw.js`.

١. انسخ `i18n/en.json` لملف جديد (مثلاً `tr.json`) وترجم القيم. ٢. زيد رمز اللغة على `i18n/index.json`. ٣. إذا بدك، زيد الترجمة بالأسئلة والدروس. ٤. زيد الملف على `sw.js`.

## Add a question / إضافة سؤال
In `data/questions.json`:
```json
{"id":"q35","lesson":"speed","sign":"speed30","weight":1,
 "q":{"nl":"…","fr":"…","ar":"…","en":"…"},
 "opts":{"nl":["…","…","…"],"fr":["…"],"ar":["…"],"en":["…"]},
 "answer":0,"explain":{"ar":"…","en":"…"}}
```
`weight: 5` = serious fault (خطأ خطير). `sign` = a key from `SIGN` in `js/icons.js` or `null`. `answer` = index of correct option.
حط السؤال بنفس الشكل. `answer` رقم الجواب الصح (يبدأ من 0).

## Run locally
`python3 -m http.server` then open http://localhost:8000 — no build step.

© Slaag. Content original; do not copy questions from commercial sites.
