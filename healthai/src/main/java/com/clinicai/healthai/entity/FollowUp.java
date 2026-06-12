package com.clinicai.healthai.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class FollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;

    private String patientName;

    private String phoneNumber;

    private String disease;

    private String treatmentStatus;

    private String followUpDate;

    private String priority;

    private String status;

    private String receptionistNotes;
}
