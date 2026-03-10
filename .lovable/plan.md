

## Move ChambyLogoText 10px Left

Update the logo wrapper's translate class in all 4 files from `-translate-x-1/2` to `-translate-x-[calc(50%+10px)]`.

### Files to change

| File | Line |
|------|------|
| `src/pages/Index.tsx` | 68 |
| `src/components/Header.tsx` | 66 |
| `src/pages/UserLanding.tsx` | 109 |
| `src/pages/ProviderLanding.tsx` | 180 |

Each change is identical — replace:
```
absolute left-1/2 -translate-x-1/2
```
with:
```
absolute left-1/2 -translate-x-[calc(50%+10px)]
```

