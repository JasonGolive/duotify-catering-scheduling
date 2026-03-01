-- 車輛類型 enum
CREATE TYPE "VehicleType" AS ENUM ('BIG_TRUCK', 'SMALL_TRUCK', 'MANAGER_CAR', 'OWN_CAR');

-- Staff: 新增駕駛能力欄位
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "canDrive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "hasOwnCar" BOOLEAN NOT NULL DEFAULT false;

-- Event: 新增餐車需求欄位
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "requireBigTruck" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "requireSmallTruck" BOOLEAN NOT NULL DEFAULT false;

-- EventStaff: 新增交通安排欄位
ALTER TABLE "event_staff" ADD COLUMN IF NOT EXISTS "vehicle" "VehicleType";
ALTER TABLE "event_staff" ADD COLUMN IF NOT EXISTS "isDriver" BOOLEAN NOT NULL DEFAULT false;
