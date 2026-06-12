package com.clinicai.healthai.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Patient {

    @Id
    private String patientId;

    private String patientName;
    private String phoneNumber;
    private String disease;
    private String followupDate;
    private String patientAvailability;
    private String treatmentStatus;
    private String receptionistNotes;
    private Boolean followUpCompleted = false;
}
