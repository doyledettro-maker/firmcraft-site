#!/bin/bash
# usage: extract.sh <scene-key> <input> <start-seconds>
set -e; k=$1; in=$2; ss=$3; mkdir -p frames/$k; rm -f frames/$k/*.jpg
ffmpeg -loglevel error -y -ss $ss -i "$in" -t 7.0 -an \
 -vf "fps=30,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,eq=saturation=0.86:contrast=1.03:gamma=0.98,colorbalance=rs=0.03:gs=0.01:bs=-0.03:rm=0.02:bm=-0.02" \
 -q:v 3 frames/$k/f%04d.jpg
echo "$k $(ls frames/$k | wc -l) frames"
