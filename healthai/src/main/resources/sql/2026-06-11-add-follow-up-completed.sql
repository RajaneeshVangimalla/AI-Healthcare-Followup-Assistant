ALTER TABLE patient
ADD COLUMN follow_up_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE patient
ADD COLUMN patient_availability VARCHAR(255) DEFAULT 'Not Mentioned';
