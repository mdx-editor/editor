#!/bin/bash

set -e

typedoc --plugin typedoc-plugin-markdown \
	--plugin typedoc-plugin-no-inherit \
	--tsconfig tsconfig.docs.json \
	--out docs/api \
	--readme none \
	--githubPages false \
	--categorizeByGroup false \
	--hideBreadcrumbs true \
	--hideMembersSymbol true \
	src/index.ts
