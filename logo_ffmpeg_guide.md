### The whole thing in one shot – pick GIF **or** WebP, run the two commands for icon + header, hit DexScreener’s 4.5 MB cap, done.

---

## 0. Which format?

| Use-case                                | Go **WebP**                              | Stick with **GIF**                      |
| --------------------------------------- | ---------------------------------------- | --------------------------------------- |
| DexScreener uploader *does* list WebP   | ✔︎ (24-bit colour, alpha, smaller files) | —                                       |
| You need fallback for ancient CMS/email | —                                        | ✔︎ (works everywhere, 256-colour limit) |

> **TL;DR** – WebP is better if the site accepts it. Only fall back to GIF when you absolutely must.

---

## 1 : 1 **Icon** (500 × 500 px)

### a. WebP (lossless, transparency)

```bash
ffmpeg -i input.mp4 \
  -filter_complex "chromakey=0x00FF00:0.14:0.02,format=rgba,\
                   scale=500:500:flags=lanczos" \
  -loop 0 -an -vcodec libwebp -lossless 1 -qscale 70 -preset picture \
  degen_icon.webp
```

*If size > 4.5 MB:* change `-lossless 1` → `0` and bump `-qscale` up (80-90).

### b. GIF (palette, transparency)

```bash
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]
      chromakey=0x00FF00:0.14:0.02,format=rgba,
      scale=500:500:flags=lanczos,
      split[ck_a][ck_b];
      [ck_a]palettegen=reserve_transparent=1[pal];
      [ck_b][pal]paletteuse=dither=sierra2_4a" \
  -gifflags +transdiff -y degen_icon.gif

gifsicle -O3 degen_icon.gif -o degen_icon.gif  # crush size, no quality loss
```

*Still heavy?* `gifsicle --lossy=30`, or drop FPS before the filter: `-vf "fps=20,chromakey=..."`.

---

## 3 : 1 **Header** (1500 × 500 px)

> Same commands, just swap the scale.

### WebP

```bash
ffmpeg -i input.mp4 \
  -filter_complex "chromakey=0x00FF00:0.14:0.02,format=rgba,\
                   scale=1500:500:flags=lanczos" \
  -loop 0 -an -vcodec libwebp -lossless 1 -qscale 70 -preset picture \
  degen_header.webp
```

### GIF

```bash
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]
      chromakey=0x00FF00:0.14:0.02,format=rgba,
      scale=1500:500:flags=lanczos,
      split[ck_a][ck_b];
      [ck_a]palettegen=reserve_transparent=1[pal];
      [ck_b][pal]paletteuse=dither=sierra2_4a" \
  -gifflags +transdiff -y degen_header.gif

gifsicle -O3 degen_header.gif -o degen_header.gif
```

*Header still > 4.5 MB?*

1. `-vf "fps=20,chromakey=..."` (cuts \~40 %).
2. Trim time: add `-t 3` right after `-i input.mp4`.
3. Last resort: `gifsicle --lossy=30`.

---

## Cheat-sheet for all the knobs

| Knob                                       | What it fixes                              |
| ------------------------------------------ | ------------------------------------------ |
| `chromakey similarity` ↓ (`0.14` → `0.12`) | Removes green fringe                       |
| `chromakey blend` ↑ (`0.02`-`0.05`)        | Softer antialiased edges                   |
| `-qscale` higher (WebP)                    | Better quality (bigger file)               |
| `--lossy=N` (gifsicle)                     | Smaller GIF at cost of slight colour bleed |
| `fps=NN` before filters                    | Straight-line file-size cut                |

---

### Sanity checklist before upload

* ✅ 500×500 & 1500×500, transparent preview looks right.
* ✅ Files each < 4.5 MB after crunching.
* ✅ Loop feels smooth; first frame isn’t ugly.

Run one pair of commands, upload the two files, ship it. If anything still breaks the limit or looks crusty, tell me what step blew up and we’ll tweak the knob—not start over.


P.S. --

The green APPEARS to be:

Hex #60C26B → RGB (96, 194, 107)

It’s a single, perfectly flat fill (σ≈0 across the whole frame), so you can drop that exact value into `chromakey=0x60C26B` (or `0x0060C26B` if your build wants 32-bit ARGB). A ±3 % similarity window (≈ 0.12–0.15 in FFmpeg) will catch any compression wobble and still leave edges crisp.