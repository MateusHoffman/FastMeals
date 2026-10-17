-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'viewer');

-- CreateEnum
CREATE TYPE "product_category" AS ENUM ('meal', 'drink', 'dessert', 'side');

-- CreateEnum
CREATE TYPE "vehicle_type" AS ENUM ('bicycle', 'motorcycle', 'car');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "category" "product_category" NOT NULL,
    "image_url" VARCHAR(500),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "preparation_time" INTEGER NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_persons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "vehicle_type" "vehicle_type" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "current_latitude" DECIMAL(10,8),
    "current_longitude" DECIMAL(11,8),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_name" VARCHAR(100) NOT NULL,
    "customer_phone" VARCHAR(20) NOT NULL,
    "delivery_address" VARCHAR(300) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "delivery_person_id" UUID,
    "delivered_at" TIMESTAMPTZ(6),
    "delivery_vehicle_type" "vehicle_type",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category");

-- CreateIndex
CREATE INDEX "idx_products_is_available" ON "products"("is_available");

-- CreateIndex
CREATE INDEX "idx_products_name" ON "products"("name");

-- CreateIndex
CREATE INDEX "idx_products_created_at" ON "products"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_products_deleted_at" ON "products"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_delivery_persons_is_active" ON "delivery_persons"("is_active");

-- CreateIndex
CREATE INDEX "idx_delivery_persons_deleted_at" ON "delivery_persons"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "orders"("status");

-- CreateIndex
CREATE INDEX "idx_orders_created_at" ON "orders"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_delivery_person_id" ON "orders"("delivery_person_id");

-- CreateIndex
CREATE INDEX "idx_orders_status_created" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_orders_status_delivered_at" ON "orders"("status", "delivered_at");

-- CreateIndex
CREATE INDEX "idx_order_items_order_id" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "idx_order_items_product_id" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_order_items_order_product" ON "order_items"("order_id", "product_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_person_id_fkey" FOREIGN KEY ("delivery_person_id") REFERENCES "delivery_persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
