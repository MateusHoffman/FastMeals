CREATE UNIQUE INDEX IF NOT EXISTS "uq_orders_one_delivering_per_person"
  ON "orders"("delivery_person_id")
  WHERE status = 'delivering' AND "delivery_person_id" IS NOT NULL;

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_lat_check";
ALTER TABLE "orders" ADD CONSTRAINT "orders_lat_check"
  CHECK ("latitude" BETWEEN -90 AND 90);

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_lng_check";
ALTER TABLE "orders" ADD CONSTRAINT "orders_lng_check"
  CHECK ("longitude" BETWEEN -180 AND 180);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
