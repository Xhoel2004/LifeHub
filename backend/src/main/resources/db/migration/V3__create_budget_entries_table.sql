CREATE TABLE budget_entries (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    type        ENUM('INCOME','EXPENSE') NOT NULL,
    amount      DECIMAL(12,2) NOT NULL,
    category    VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    entry_date  DATE NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_budget_entries_user_id (user_id),
    INDEX idx_budget_entries_entry_date (entry_date)
);
