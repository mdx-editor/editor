#!/usr/bin/env bash
set -e

api-extractor run --local 
find dist \( \( -name '*.d.ts*' ! -name 'index.d.ts' \) -or \( -type d -empty \) \) -delete
