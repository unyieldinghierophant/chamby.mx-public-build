

## Replace Provider Landing Video with Unsplash Slideshow

### What changes

Replace the video background in the provider landing hero (lines 278-293 of `ProviderLanding.tsx`) with a slideshow of 10 curated Unsplash photos of handymen/tradespeople at work, crossfading every 7 seconds.

### New component: `ProviderHeroSlideshow.tsx`

A self-contained component that:
- Holds an array of 10 Unsplash image URLs (direct links via `images.unsplash.com` with size params for performance)
- Preloads images in the background using `new Image()` on mount
- Uses a `currentIndex` state that increments every 7s via `setInterval`
- Renders all 10 `<img>` tags stacked absolutely; the active one gets `opacity-100`, others `opacity-0`, with `transition-opacity duration-1000 ease-in-out`
- Calls `onReady()` once the first image loads (wired to `onHeroMediaReady` for the skeleton overlay)
- Images use `object-cover` to fill the container, matching the current video behavior

### Images selected (Unsplash, free-to-use)

10 photos of tradespeople working -- electricians, plumbers, painters, carpenters, handymen. Using Unsplash source URLs with `w=1920&q=80` for good quality without excessive size.

### Changes to `ProviderLanding.tsx`

- Remove the `providerHeroBg` import and `videoReady` state
- Replace the `<video>` block (lines 278-293) with `<ProviderHeroSlideshow onReady={onHeroMediaReady} />`
- Keep overlays (green tint + gradient) unchanged on top of the slideshow

### Visual behavior

- First image fades in from transparent (like the current video), hiding the skeleton
- Subsequent images crossfade smoothly over 1s every 7s
- No layout shift -- images are absolutely positioned and cover the container

