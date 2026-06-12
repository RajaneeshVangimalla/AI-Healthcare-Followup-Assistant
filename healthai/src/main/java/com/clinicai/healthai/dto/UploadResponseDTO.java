package com.clinicai.healthai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UploadResponseDTO {

    private String message;
    private int recordsUploaded;
}