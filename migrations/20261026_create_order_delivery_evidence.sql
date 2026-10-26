CREATE TABLE IF NOT EXISTS order_delivery_evidence (
    OrderID INT NOT NULL,
    endpoint ENUM('sender', 'receiver') NOT NULL,
    image_data MEDIUMBLOB NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) DEFAULT NULL,
    updated_by INT DEFAULT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (OrderID, endpoint),
    CONSTRAINT fk_order_delivery_evidence_order
        FOREIGN KEY (OrderID) REFERENCES shipping_orders (OrderID)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
