#!/bin/bash
# Railway Migration Fix Script
# Run this in Railway Shell to fix the failed migration

echo "🔧 Fixing failed migration..."

# Step 1: Mark the failed migration as rolled back
echo "📝 Step 1: Marking migration as rolled back..."
npx prisma migrate resolve --rolled-back 20260304_add_notes_to_availability_token

# Step 2: Add the column manually (safe with IF NOT EXISTS)
echo "📝 Step 2: Adding notes column..."
echo 'ALTER TABLE "AvailabilityToken" ADD COLUMN IF NOT EXISTS "notes" VARCHAR(600);' | npx prisma db execute --stdin

# Step 3: Mark the migration as applied
echo "📝 Step 3: Marking migration as applied..."
npx prisma migrate resolve --applied 20260304_add_notes_to_availability_token

# Step 4: Verify status
echo "📝 Step 4: Verifying migration status..."
npx prisma migrate status

echo "✅ Migration fix completed!"
