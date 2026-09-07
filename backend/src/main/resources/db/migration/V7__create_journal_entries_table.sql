CREATE TABLE journal_entries (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    title       VARCHAR(150) NOT NULL,
    body        TEXT NOT NULL,
    mood        ENUM('GREAT','GOOD','OKAY','LOW','AWFUL') NOT NULL DEFAULT 'OKAY',
    entry_date  DATE NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_journal_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_journal_entries_user_id (user_id),
    INDEX idx_journal_entries_entry_date (entry_date)
);
