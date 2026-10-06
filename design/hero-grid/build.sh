#!/usr/bin/env bash
# Builds the homepage hero grid videos and poster.
#
# Desktop: 4x2 grid (1920x1068). Phones: 2x2 grid (720x1080, portrait).
# Each tile rests on its first frame, plays 4s of its clip, then dissolves
# back over 1s. A new tile starts every 3s (desktop) or 6s (phones), so the
# 24s loop has at most two tiles moving and wraps without a jump.
#
# Usage: design/hero-grid/build.sh [workdir]
# Outputs to public/media/: hero-1080.mp4, hero-1080.webm, hero-720.mp4,
# hero-poster.jpg. Requires curl and ffmpeg. Credits: public/media/CREDITS.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${1:-$(mktemp -d)}"
OUT="$ROOT/public/media"
mkdir -p "$WORK/raw" "$WORK/tiles"
cd "$WORK"

GRADE="eq=saturation=0.8:contrast=0.96,colorbalance=rm=0.03:gm=0.0:bm=-0.03"
NAVY="0x0E1B2E"
# Extra navy darkening on the left so the hero text stays legible.
SHADE="color=c=$NAVY:s=1920x1068,format=rgba,geq=r='14':g='27':b='46':a='255*0.22*max(0\,1-X/(W*0.55))'"

# Download the HD rendition of a Pexels video by id.
fetch() {
  local id=$1 name=$2 url fps
  [ -s "raw/$name.mp4" ] && return
  url=$(curl -sS -o /dev/null -w '%{redirect_url}' -A 'Mozilla/5.0' "https://www.pexels.com/download/video/$id/")
  fps=$(echo "$url" | grep -oE '[0-9.]+fps')
  if echo "$url" | grep -qE '_(1080|2160)_(1920|4096)_'; then size=hd_1080_1920; else size=hd_1920_1080; fi
  curl -fsS -A 'Mozilla/5.0' -o "raw/$name.mp4" "https://videos.pexels.com/video-files/$id/$id-${size}_$fps.mp4" \
    || curl -fsS -A 'Mozilla/5.0' -o "raw/$name.mp4" "$url"
}

# tile <out> <clip> <in-point> <scale> <crop-x> <crop-y> <start-in-loop> <w> <h>
tile() {
  local n=$1 src=$2 ss=$3 sc=$4 cx=$5 cy=$6 s=$7 w=$8 h=$9
  ffmpeg -v error -y -ss "$ss" -t 5 -i "raw/$src.mp4" \
    -vf "fps=30,$sc,crop=$((w-2)):$((h-2)):$cx:$cy,$GRADE,pad=$w:$h:1:1:color=$NAVY,setsar=1,format=yuv420p" \
    -an -c:v libx264 -crf 14 -preset fast "tiles/$n-seg.mp4"
  ffmpeg -v error -y -i "tiles/$n-seg.mp4" -frames:v 1 "tiles/$n-still.png"
  ffmpeg -v error -y -i "tiles/$n-seg.mp4" -loop 1 -framerate 30 -t 20 -i "tiles/$n-still.png" \
    -filter_complex "[0]fps=30,settb=1/30,setpts=N[a];[1]fps=30,format=yuv420p,setsar=1,settb=1/30,setpts=N[s];[a][s]xfade=transition=fade:duration=1:offset=4,format=yuv420p" \
    -c:v libx264 -crf 14 -preset fast "tiles/$n-base.mp4"
  if [ "$s" = 0 ]; then
    cp "tiles/$n-base.mp4" "tiles/$n-loop.mp4"
  else
    local a=$((24 - s))
    ffmpeg -v error -y -i "tiles/$n-base.mp4" \
      -filter_complex "[0]trim=start=$a:end=24,setpts=PTS-STARTPTS[p];[0]trim=start=0:end=$a,setpts=PTS-STARTPTS[q];[p][q]concat=n=2:v=1" \
      -c:v libx264 -crf 14 -preset fast "tiles/$n-loop.mp4"
  fi
}

fetch 7541838 mechanic
fetch 7347880 property
fetch 8964379 site
fetch 5404697 florist
fetch 8626269 kitchen
fetch 7693477 figures
fetch 4293956 warehouse
fetch 7593288 leadership

# Desktop tiles, 480x534. Grid order: top row left to right, then bottom row.
tile d-mechanic   mechanic   7 "scale=-2:534" 200 1    9  480 534
tile d-property   property   3 "scale=-2:534" 105 1   21  480 534
tile d-site       site       1 "scale=-2:534" 300 1   12  480 534
tile d-florist    florist    2 "scale=-2:700" 700 166  0  480 534
tile d-kitchen    kitchen    3 "scale=-2:600" 293 34  15  480 534
tile d-figures    figures    3 "scale=-2:534" 282 1    3  480 534
tile d-warehouse  warehouse  1 "scale=-2:534" 187 1   18  480 534
tile d-leadership leadership 4 "scale=480:-2" 1   290  6  480 534

DESK="d-mechanic d-property d-site d-florist d-kitchen d-figures d-warehouse d-leadership"
GRID="xstack=inputs=8:layout=0_0|480_0|960_0|1440_0|0_534|480_534|960_534|1440_534"

IN=(); for n in $DESK; do IN+=(-i "tiles/$n-loop.mp4"); done
ffmpeg -v error -y "${IN[@]}" -f lavfi -i "$SHADE" \
  -filter_complex "[0][1][2][3][4][5][6][7]$GRID[g];[g][8]overlay=0:0:shortest=1,format=yuv420p" \
  -t 24 -c:v libx264 -crf 14 -preset slow desktop-master.mp4

ffmpeg -v error -y -i desktop-master.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 26 -maxrate 3M -bufsize 6M -preset slow -g 60 -movflags +faststart "$OUT/hero-1080.mp4"
ffmpeg -v error -y -i desktop-master.mp4 -an -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 \
  -deadline good -cpu-used 2 "$OUT/hero-1080.webm"

# Poster: every tile at rest.
IN=(); for n in $DESK; do IN+=(-i "tiles/$n-still.png"); done
ffmpeg -v error -y "${IN[@]}" -f lavfi -i "$SHADE" \
  -filter_complex "[0][1][2][3][4][5][6][7]$GRID[g];[g][8]overlay" -frames:v 1 -q:v 8 "$OUT/hero-poster.jpg"

# Phone tiles, 360x540, 2x2.
tile m-mechanic   mechanic   7 "scale=-2:540" 260 1    0  360 540
tile m-florist    florist    2 "scale=-2:700" 753 162 12  360 540
tile m-site       site       1 "scale=-2:540" 367 1   18  360 540
tile m-leadership leadership 4 "scale=360:-2" 1   100  6  360 540

ffmpeg -v error -y -i tiles/m-mechanic-loop.mp4 -i tiles/m-florist-loop.mp4 \
  -i tiles/m-site-loop.mp4 -i tiles/m-leadership-loop.mp4 \
  -filter_complex "xstack=inputs=4:layout=0_0|360_0|0_540|360_540,format=yuv420p" \
  -t 24 -an -c:v libx264 -profile:v high -crf 26 -maxrate 1.6M -bufsize 3.2M -preset slow -g 60 \
  -movflags +faststart "$OUT/hero-720.mp4"

ls -l "$OUT"/hero-*
