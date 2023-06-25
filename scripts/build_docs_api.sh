#!/bin/bash

set -e

typedoc --plugin typedoc-plugin-markdown \
	--tsconfig tsconfig.docs.json \
	--out docs/api \
	--readme none \
	--githubPages false \
	--categorizeByGroup false \
	--hideBreadcrumbs true \
	--hideMembersSymbol true \
	dist/index.d.ts
