-- CreateEnum
CREATE TYPE "MenuItemCategory" AS ENUM ('APPETIZER', 'MAIN', 'SIDE', 'SOUP', 'SALAD', 'DESSERT', 'BEVERAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "MenuTemplateType" AS ENUM ('BBQ', 'WINE', 'ITALIAN_FRENCH', 'MIXED', 'CUSTOM');

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" "MenuItemCategory" NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "defaultQuantityPerPerson" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "ingredientName" VARCHAR(100) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "notes" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "MenuTemplateType" NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_menus" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "templateId" TEXT,
    "templateVersion" INTEGER,
    "templateName" VARCHAR(100),
    "lockedAt" TIMESTAMP(3),
    "lockedBy" VARCHAR(50),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_menu_items" (
    "id" TEXT NOT NULL,
    "eventMenuId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "itemName" VARCHAR(100) NOT NULL,
    "itemCategory" VARCHAR(50) NOT NULL,
    "itemUnit" VARCHAR(20) NOT NULL,
    "quantityPerPerson" DECIMAL(10,2) NOT NULL,
    "totalQuantity" DECIMAL(10,2) NOT NULL,
    "bomSnapshot" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_items_category_idx" ON "menu_items"("category");
CREATE INDEX "menu_items_isActive_idx" ON "menu_items"("isActive");

-- CreateIndex
CREATE INDEX "bom_items_menuItemId_idx" ON "bom_items"("menuItemId");

-- CreateIndex
CREATE INDEX "menu_templates_type_idx" ON "menu_templates"("type");
CREATE INDEX "menu_templates_isActive_idx" ON "menu_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "menu_template_items_templateId_menuItemId_key" ON "menu_template_items"("templateId", "menuItemId");
CREATE INDEX "menu_template_items_templateId_idx" ON "menu_template_items"("templateId");
CREATE INDEX "menu_template_items_menuItemId_idx" ON "menu_template_items"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "event_menus_eventId_key" ON "event_menus"("eventId");
CREATE INDEX "event_menus_eventId_idx" ON "event_menus"("eventId");
CREATE INDEX "event_menus_templateId_idx" ON "event_menus"("templateId");

-- CreateIndex
CREATE INDEX "event_menu_items_eventMenuId_idx" ON "event_menu_items"("eventMenuId");
CREATE INDEX "event_menu_items_menuItemId_idx" ON "event_menu_items"("menuItemId");

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_template_items" ADD CONSTRAINT "menu_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "menu_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "menu_template_items" ADD CONSTRAINT "menu_template_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_menus" ADD CONSTRAINT "event_menus_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_menus" ADD CONSTRAINT "event_menus_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "menu_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_menu_items" ADD CONSTRAINT "event_menu_items_eventMenuId_fkey" FOREIGN KEY ("eventMenuId") REFERENCES "event_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_menu_items" ADD CONSTRAINT "event_menu_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
