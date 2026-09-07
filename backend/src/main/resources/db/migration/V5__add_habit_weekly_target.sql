ALTER TABLE habits
    ADD COLUMN weekly_target TINYINT NOT NULL DEFAULT 7 AFTER description;
