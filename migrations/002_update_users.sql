-- Recreate users table to exactly match backend/models/tables.py

BEGIN;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id                   TEXT PRIMARY KEY,
    name                 VARCHAR(100) NOT NULL,
    email                VARCHAR(254) NOT NULL UNIQUE,
    preferred_sport      VARCHAR(20) NOT NULL,
    skill_level          VARCHAR(20) NOT NULL,
    equipment            JSONB NOT NULL,
    preferred_terrain    VARCHAR(20) NOT NULL,
    skier_type           INT,
    birthday             DATE,
    weight_lbs           FLOAT8,
    height_in            FLOAT8,
    boot_sole_length_mm  INT,
    din                  FLOAT8 NOT NULL,
    password_hash        TEXT,
    created_at           TIMESTAMPTZ NOT NULL,
    updated_at           TIMESTAMPTZ NOT NULL
);

COMMIT;
