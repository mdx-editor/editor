#!/bin/bash

set -e

./node_modules/.bin/api-extractor run --local --verbose
api-documenter markdown --input-folder ./temp --output-folder ./docs/api
