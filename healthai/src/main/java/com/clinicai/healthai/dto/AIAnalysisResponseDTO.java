package com.clinicai.healthai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AIAnalysisResponseDTO {

    private String brief;
    private String followUpMessage;
}
