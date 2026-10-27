CREATE TABLE IF NOT EXISTS driver_partners_order_details (
    DriverOrderID INT NOT NULL AUTO_INCREMENT,
    DriverPartnerIDs INT DEFAULT NULL,
    OrderIDs INT DEFAULT NULL,
    PRIMARY KEY (DriverOrderID),
    KEY idx_driver_partners_order_details_driver (DriverPartnerIDs),
    KEY idx_driver_partners_order_details_order (OrderIDs),
    CONSTRAINT fk_driver_partners_order_details_driver
        FOREIGN KEY (DriverPartnerIDs) REFERENCES driver_partners (DriverPartnerIDs)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_driver_partners_order_details_order
        FOREIGN KEY (OrderIDs) REFERENCES shipping_orders (OrderID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
