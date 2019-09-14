#!/usr/bin/env bash
export PATH=$(npm bin):$PATH;
tsc
browserify public/js/index.js > bundle.js
rm -rf public/js/*
mv bundle.js public/js/bundle.js