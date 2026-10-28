ALTER TABLE shipping_orders
    ADD COLUMN receiving_driver_name VARCHAR(100) NULL,
    ADD COLUMN receiving_driver_license_plate VARCHAR(20) NULL,
    ADD COLUMN receiving_driver_phone_number VARCHAR(45) NULL,
    ADD COLUMN delivery_driver_name VARCHAR(100) NULL,
    ADD COLUMN delivery_driver_license_plate VARCHAR(20) NULL,
    ADD COLUMN delivery_driver_phone_number VARCHAR(45) NULL;

UPDATE shipping_orders
SET receiving_driver_name = driver_name,
    receiving_driver_license_plate = driver_license_plate,
    receiving_driver_phone_number = driver_phone_number
WHERE OrderID >= 0
  AND receiving_driver_name IS NULL;
