#!/bin/bash

set -e

api-extractor run --local --verbose
api-documenter markdown --input-folder ./temp --output-folder ./docs/api
