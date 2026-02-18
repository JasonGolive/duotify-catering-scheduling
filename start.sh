#!/bin/sh
# Start Next.js with explicit port from Railway's PORT env var
exec npx next start -H 0.0.0.0 -p ${PORT:-3000}
