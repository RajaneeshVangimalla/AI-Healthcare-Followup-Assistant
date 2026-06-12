package com.clinicai.healthai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SummaryResponseDTO {

    private String patientBrief;
    private String followUpMessage;
}
