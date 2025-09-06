-- Add mobile_number column to leads table
ALTER TABLE leads ADD COLUMN mobile_number VARCHAR NOT NULL DEFAULT '+910000000000';

-- Remove the default constraint after adding the column
ALTER TABLE leads ALTER COLUMN mobile_number DROP DEFAULT;
