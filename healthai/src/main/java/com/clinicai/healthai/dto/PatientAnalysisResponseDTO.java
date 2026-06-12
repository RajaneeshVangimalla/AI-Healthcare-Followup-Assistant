package com.clinicai.healthai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PatientAnalysisResponseDTO {

    private String patientId;
    private String patientName;
    private String phoneNumber;
    private String disease;
    private String followupDate;
    private String treatmentStatus;
    private String receptionistNotes;
    private String patientBrief;
    private String followUpMessage;
}
