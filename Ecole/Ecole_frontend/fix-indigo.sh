#!/bin/bash
cd "$(dirname "$0")/src/app/features"

# StatsCard color
find . -name "*.jsx" -exec sed -i 's/color="indigo"/color="primary"/g' {} +

# bg-indigo
find . -name "*.jsx" -exec sed -i 's/bg-indigo-100/bg-[var(--primary-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/bg-indigo-50/bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/bg-indigo-500/bg-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/bg-indigo-600/bg-[var(--accent)]/g' {} +

# text-indigo
find . -name "*.jsx" -exec sed -i 's/text-indigo-700/text-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/text-indigo-600/text-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/text-indigo-500/text-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/text-indigo-400/text-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/text-indigo-300/text-[var(--accent)]/g' {} +

# border-indigo
find . -name "*.jsx" -exec sed -i 's/border-indigo-500/border-[var(--accent)]/g' {} +

# ring-indigo
find . -name "*.jsx" -exec sed -i 's/ring-indigo-500/ring-[var(--accent)]/g' {} +

# focus
find . -name "*.jsx" -exec sed -i 's/focus:ring-indigo-500\/40/focus:ring-[var(--accent)]\/40/g' {} +
find . -name "*.jsx" -exec sed -i 's/focus:ring-indigo-100/focus:ring-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/focus:border-indigo-400/focus:border-[var(--accent)]/g' {} +

# dark variants (must run before standalone variants to avoid double-matching)
find . -name "*.jsx" -exec sed -i 's/dark:bg-indigo-900\/20/bg-[var(--primary-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:bg-indigo-950\/40/bg-[var(--primary-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:bg-indigo-950\/30/bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:bg-indigo-950\/20/bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:bg-indigo-500\/5/bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:bg-indigo-500\/8/bg-[var(--accent-subtle)]/g' {} +

find . -name "*.jsx" -exec sed -i 's/dark:text-indigo-400/text-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:text-indigo-300/text-[var(--accent)]/g' {} +

find . -name "*.jsx" -exec sed -i 's/dark:border-indigo-700/border-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:border-indigo-600/border-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:border-indigo-500/border-[var(--accent)]/g' {} +

# hover
find . -name "*.jsx" -exec sed -i 's/hover:bg-indigo-100/hover:bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/hover:bg-indigo-50/hover:bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/hover:bg-indigo-600/hover:bg-[var(--accent-hover)]/g' {} +

find . -name "*.jsx" -exec sed -i 's/hover:text-indigo-600/hover:text-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/hover:text-indigo-400/hover:text-[var(--accent)]/g' {} +

find . -name "*.jsx" -exec sed -i 's/hover:border-indigo-200/hover:border-[var(--accent)]\/30/g' {} +

# dark:hover
find . -name "*.jsx" -exec sed -i 's/dark:hover:bg-indigo-950\/50/hover:bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:hover:bg-indigo-950\/30/hover:bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:hover:bg-indigo-950\/20/hover:bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:hover:bg-indigo-900\/20/hover:bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:hover:bg-indigo-900\/10/hover:bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:hover:border-indigo-700/hover:border-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/dark:hover:text-indigo-400/hover:text-[var(--accent)]/g' {} +

# Gradients
find . -name "*.jsx" -exec sed -i 's/bg-gradient-to-br from-indigo-500 to-purple-600/bg-[var(--accent)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/from-indigo-500\/20 to-purple-600\/20/bg-[var(--accent-subtle)]/g' {} +
find . -name "*.jsx" -exec sed -i 's/shadow-lg shadow-indigo-500\/20/shadow-3/g' {} +

echo "Done! Checking remaining..."
grep -r "indigo" --include="*.jsx" -l 2>/dev/null
count=$(grep -r "indigo" --include="*.jsx" -l 2>/dev/null | wc -l)
echo "$count files still contain 'indigo'"
