#!/usr/bin/env bash
# Downloads the raw word data used by scripts/build-words.ts into data/raw/.
# Sources:
#   - Zemberek-NLP lexicons (Apache-2.0): https://github.com/ahmetaa/zemberek-nlp
#   - hermitdave/FrequencyWords (MIT):    https://github.com/hermitdave/FrequencyWords
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p data/raw

ZEMBEREK="https://raw.githubusercontent.com/ahmetaa/zemberek-nlp/master/morphology/src/main/resources/tr"
FREQ="https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/tr"

curl -sfL -o data/raw/master-dictionary.dict "$ZEMBEREK/master-dictionary.dict"
curl -sfL -o data/raw/non-tdk.dict          "$ZEMBEREK/non-tdk.dict"
curl -sfL -o data/raw/first-10K             "$ZEMBEREK/first-10K"
curl -sfL -o data/raw/tr_50k.txt            "$FREQ/tr_50k.txt"

echo "done:"
wc -l data/raw/*
