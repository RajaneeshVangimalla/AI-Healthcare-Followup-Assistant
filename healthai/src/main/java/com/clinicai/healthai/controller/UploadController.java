package com.clinicai.healthai.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.clinicai.healthai.dto.UploadResponseDTO;
import com.clinicai.healthai.entity.Patient;
import com.clinicai.healthai.entity.WhatsAppMessage;
import com.clinicai.healthai.service.ExcelService;
import com.clinicai.healthai.util.ExcelReaderUtil;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class UploadController {

    private final ExcelService excelService;

    public UploadController(ExcelService excelService) {
        this.excelService = excelService;
    }

    @PostMapping("/patients")
    public ResponseEntity<UploadResponseDTO> uploadPatients(
            @RequestParam("file") MultipartFile file) {

        try {

            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponseDTO(
                                "Please select a file",
                                0
                        ));
            }

            List<Patient> patients
                    = ExcelReaderUtil.readPatients(file.getInputStream());

            excelService.savePatients(patients);

            return ResponseEntity.status(HttpStatus.OK)
                    .body(new UploadResponseDTO(
                            "Patients Uploaded Successfully",
                            patients.size()
                    ));

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new UploadResponseDTO(
                            "Upload Failed: " + e.getMessage(),
                            0
                    ));
        }
    }

    @PostMapping("/messages")
    public ResponseEntity<UploadResponseDTO> uploadMessages(
            @RequestParam("file") MultipartFile file) {

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponseDTO(
                                "Please select a file",
                                0
                        ));
            }

            List<WhatsAppMessage> messages
                    = ExcelReaderUtil.readMessages(file.getInputStream());

            excelService.saveMessages(messages);

            return ResponseEntity.ok(
                    new UploadResponseDTO(
                            "Messages Uploaded Successfully",
                            messages.size()
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(new UploadResponseDTO(
                            "Upload Failed",
                            0
                    ));
        }
    }

    @PostMapping("/all")
    public ResponseEntity<UploadResponseDTO> uploadPatientsAndMessages(
            @RequestParam("patientFile") MultipartFile patientFile,
            @RequestParam("messageFile") MultipartFile messageFile) {

        if (patientFile.isEmpty() || messageFile.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new UploadResponseDTO(
                            "Please select both patient and WhatsApp Excel files",
                            0
                    ));
        }

        try {
            List<Patient> patients
                    = ExcelReaderUtil.readPatients(patientFile.getInputStream());
            List<WhatsAppMessage> messages
                    = ExcelReaderUtil.readMessages(messageFile.getInputStream());

            excelService.savePatients(patients);
            excelService.saveMessages(messages);

            return ResponseEntity.ok(
                    new UploadResponseDTO(
                            "Uploaded " + patients.size() + " patients and "
                                    + messages.size() + " WhatsApp messages successfully",
                            patients.size() + messages.size()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new UploadResponseDTO(
                            "Upload Failed: " + e.getMessage(),
                            0
                    ));
        }
    }
}
