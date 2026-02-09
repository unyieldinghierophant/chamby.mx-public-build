

# Plan: Circular Safe-Area Icon Adjustment

## Problem
All current icon files (favicon, apple-touch-icon, android-chrome) have the Chamby house logo filling the entire canvas with no internal padding. When platforms apply circular masks (iOS, Google Search, PWA), the roof and sides of the house get clipped.

## Solution
Use AI image generation to create two properly padded icon variants from the existing logo, then export them at all required sizes and replace the current files.

## Variant A -- Standard App / PWA Icon (82-85% safe area)
- For: iOS app icon, Android adaptive icon, PWA icon
- The logo occupies ~83% of the canvas, centered optically (shifted ~1-2% down since the roof peak draws the eye upward)
- White background fills the remaining space
- Used for: `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`

## Variant B -- Small-Icon / Search Variant (86-88% safe area)
- For: Browser favicon, Google Search brand icon
- The logo occupies ~87% of the canvas with tighter but fully safe padding
- White background
- Used for: `favicon.png`, `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`

## Files to Replace

| File | Size | Variant |
|------|------|---------|
| `public/apple-touch-icon.png` | 180x180 | A (83%) |
| `public/android-chrome-512x512.png` | 512x512 | A (83%) |
| `public/android-chrome-192x192.png` | 192x192 | A (83%) |
| `public/favicon.png` | 512x512 | B (87%) |
| `public/favicon-32x32.png` | 32x32 | B (87%) |
| `public/favicon-16x16.png` | 16x16 | B (87%) |
| `public/favicon.ico` | 32x32 | B (87%) |
| `src/assets/chamby-logo-icon.png` | 1024x1024 | A (83%) |

## Process
1. Generate a master 1024x1024 Variant A image using AI image generation: the existing Chamby house-face logo centered on a white square canvas with ~8.5% padding on each side, optically adjusted slightly downward
2. Generate a master 1024x1024 Variant B image with ~6.5% padding per side
3. Export/resize to all required dimensions listed above
4. Replace all files in `public/` and `src/assets/`
5. No code changes needed -- filenames and manifest stay the same

## What Will NOT Change
- Logo design, proportions, colors, stroke weights, facial expression
- File names or paths
- `site.webmanifest` configuration
- `index.html` meta tags
- Any component code

## Technical Notes
- The AI image editor will be given the current `public/favicon.png` as input with instructions to place it on a white canvas with precise padding ratios
- Multiple generation attempts may be needed to nail the optical centering
- Final output will be PNG files at exact pixel dimensions

