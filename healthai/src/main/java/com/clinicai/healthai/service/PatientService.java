package com.clinicai.healthai.service;

import com.clinicai.healthai.dto.PatientAnalysisResponseDTO;
import com.clinicai.healthai.entity.Patient;
import com.clinicai.healthai.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final PatientSummaryService patientSummaryService;

    public PatientService(
            PatientRepository patientRepository,
            PatientSummaryService patientSummaryService) {

        this.patientRepository = patientRepository;
        this.patientSummaryService = patientSummaryService;
    }

    public PatientAnalysisResponseDTO searchByPhoneNumber(String phoneNumber) {
        Patient patient = patientRepository
                .findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new NoSuchElementException("Patient not found"));

        PatientSummaryService.PatientAnalysis analysis =
                patientSummaryService.generateAnalysis(patient);

        return new PatientAnalysisResponseDTO(
                patient.getPatientId(),
                patient.getPatientName(),
                patient.getPhoneNumber(),
                patient.getDisease(),
                patient.getFollowupDate(),
                patient.getTreatmentStatus(),
                patient.getReceptionistNotes(),
                analysis.patientBrief(),
                analysis.followUpMessage());
    }

    public List<Patient> getPatientsByFollowUpDate(LocalDate followUpDate) {
        return patientRepository.findByFollowupDateOrderByPatientNameAsc(
                followUpDate.toString());
    }

    @Transactional
    public Patient markFollowUpCompleted(String patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NoSuchElementException("Patient not found"));

        patient.setFollowUpCompleted(true);

        return patientRepository.save(patient);
    }

}
