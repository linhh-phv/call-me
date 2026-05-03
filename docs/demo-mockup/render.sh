#!/usr/bin/env bash
# Renders frame-N PNGs from index.html via headless Chrome, then compiles into demo.gif.
set -euo pipefail

cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
HTML="$(pwd)/index.html"

# Per-frame durations in centiseconds (gif delay), matching the visual narrative
DELAYS=(150 60 150 60 200 120 180 120 120 100)

mkdir -p frames
rm -f frames/*.png

for i in $(seq 1 10); do
  echo "rendering frame $i..."
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --window-size=400,780 \
    --screenshot="frames/frame-$(printf '%02d' $i).png" \
    "file://$HTML?frame=$i" \
    > /dev/null 2>&1
done

# Build palette for nicer gif colors
ffmpeg -y -i frames/frame-01.png -vf "scale=400:780:flags=lanczos,palettegen=max_colors=128" frames/palette.png > /dev/null 2>&1

# Build animated gif using concat + paletteuse
# Each frame inserted N times to control per-frame duration. Output at 10fps.
CONCAT="frames/concat.txt"
> "$CONCAT"
for i in $(seq 1 10); do
  reps=${DELAYS[$((i-1))]}
  # 10fps means 10 reps per second; convert centiseconds to frames at 10fps: reps/10
  count=$(( (reps + 5) / 10 ))
  [ "$count" -lt 1 ] && count=1
  for r in $(seq 1 $count); do
    echo "file 'frame-$(printf '%02d' $i).png'" >> "$CONCAT"
    echo "duration 0.1" >> "$CONCAT"
  done
done
# ffmpeg requires the last file to be repeated without duration
echo "file 'frame-10.png'" >> "$CONCAT"

ffmpeg -y -f concat -safe 0 -i "$CONCAT" -i frames/palette.png \
  -filter_complex "fps=10,scale=400:780:flags=lanczos[x];[x][1:v]paletteuse" \
  -loop 0 \
  ../demo.gif > /dev/null 2>&1

ls -la ../demo.gif
echo "Done -> docs/demo.gif"
