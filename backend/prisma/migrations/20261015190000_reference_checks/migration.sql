-- Alinhamento com desafio/docs/database-schema.md (validação em banco além do Zod)

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_price_check";
ALTER TABLE "products" ADD CONSTRAINT "products_price_check"
  CHECK ("price" > 0);

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_preparation_time_check";
ALTER TABLE "products" ADD CONSTRAINT "products_preparation_time_check"
  CHECK ("preparation_time" BETWEEN 1 AND 120);

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_total_amount_check";
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_amount_check"
  CHECK ("total_amount" > 0);

ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_quantity_check";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_check"
  CHECK ("quantity" > 0);

ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_unit_price_check";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_check"
  CHECK ("unit_price" > 0);
