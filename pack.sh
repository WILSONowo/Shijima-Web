#!/usr/bin/env bash

set -e

rm -rf dist
mkdir -p dist/build
uglifyjs -- main.js > dist/main.js
uglifyjs -- wrapper.js > dist/wrapper.js
cp build/Shijima-Web.{js,wasm} dist/build/
cp test.html dist/index.html
cp shimejiee.zip dist/shimejiee.zip
