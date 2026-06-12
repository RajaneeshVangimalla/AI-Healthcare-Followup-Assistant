package com.clinicai.healthai.controller;

import com.clinicai.healthai.dto.PatientAnalysisResponseDTO;
import com.clinicai.healthai.entity.Patient;
import com.clinicai.healthai.entity.WhatsAppMessage;
import com.clinicai.healthai.repository.PatientRepository;
import com.clinicai.healthai.repository.WhatsAppMessageRepository;
import com.clinicai.healthai.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientRepository patientRepository;
    private final WhatsAppMessageRepository messageRepository;
    private final PatientService patientService;

    public PatientController(
            PatientRepository patientRepository,
            WhatsAppMessageRepository messageRepository,
            PatientService patientService) {

        this.patientRepository = patientRepository;
        this.messageRepository = messageRepository;
        this.patientService = patientService;
    }

    @GetMapping
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable String id) {
        return patientRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<WhatsAppMessage>> getPatientMessages(
            @PathVariable String id) {

        return patientRepository.findById(id)
                .map(patient -> ResponseEntity.ok(
                        messageRepository.findTop10ByPhoneNumberOrderByIdDesc(
                                patient.getPhoneNumber())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/followup")
    public List<Patient> getPatientsByFollowUpDate(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return patientService.getPatientsByFollowUpDate(date);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Patient> markFollowUpCompleted(
            @PathVariable String id) {

        try {
            return ResponseEntity.ok(
                    patientService.markFollowUpCompleted(id));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<PatientAnalysisResponseDTO> searchPatient(
            @RequestParam String phoneNumber) {

        return search(phoneNumber);
    }

    @GetMapping("/search/{phoneNumber}")
    public ResponseEntity<PatientAnalysisResponseDTO> searchPatientByPath(
            @PathVariable String phoneNumber) {

        return search(phoneNumber);
    }

    private ResponseEntity<PatientAnalysisResponseDTO> search(String phoneNumber) {
        try {
            return ResponseEntity.ok(
                    patientService.searchByPhoneNumber(phoneNumber));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
