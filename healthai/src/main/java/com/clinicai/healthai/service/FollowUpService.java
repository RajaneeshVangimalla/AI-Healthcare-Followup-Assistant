package com.clinicai.healthai.service;

import com.clinicai.healthai.entity.FollowUp;
import com.clinicai.healthai.entity.Patient;
import com.clinicai.healthai.repository.FollowUpRepository;
import com.clinicai.healthai.repository.PatientRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final PatientRepository patientRepository;

    public FollowUpService(
            FollowUpRepository followUpRepository,
            PatientRepository patientRepository) {

        this.followUpRepository = followUpRepository;
        this.patientRepository = patientRepository;
    }

    public void createFollowUp(
            Patient patient,
            String patientBrief) {

        FollowUp followUp = createOrUpdatePendingFollowUp(patient);

        String summary = patientBrief == null ? "" : patientBrief.toLowerCase(Locale.ROOT);

        if (summary.contains("surgery")
                || summary.contains("fear")
                || summary.contains("urgent")) {

            followUp.setPriority("HIGH");
            followUp.setFollowUpDate(
                    LocalDate.now()
                            .plusDays(2)
                            .toString());
        }

        followUpRepository.save(followUp);
    }

    public void createFollowUpFromPatient(Patient patient) {
        FollowUp followUp = createOrUpdatePendingFollowUp(patient);
        followUpRepository.save(followUp);
    }

    public List<FollowUp> getAllUniqueFollowUpsByPriority() {
        syncPatientsToFollowUps();

        List<FollowUp> followUps = followUpRepository.findAll(
                Sort.by(Sort.Direction.DESC, "id"));

        Map<String, FollowUp> uniqueFollowUps =
                new LinkedHashMap<>();

        for (FollowUp followUp : followUps) {
            String key = followUp.getPatientId();

            if (key == null || key.isBlank()) {
                key = followUp.getPhoneNumber();
            }

            if (key == null || key.isBlank()) {
                key = String.valueOf(followUp.getId());
            }

            uniqueFollowUps.putIfAbsent(key, followUp);
        }

        List<FollowUp> sortedFollowUps =
                new ArrayList<>(uniqueFollowUps.values());

        sortedFollowUps.sort(
                Comparator.comparingInt(this::priorityOrder)
                        .thenComparing(this::followUpDate)
                        .thenComparing(
                                FollowUp::getId,
                                Comparator.nullsLast(Comparator.reverseOrder())));

        return sortedFollowUps;
    }

    public void syncPatientsToFollowUps() {
        List<Patient> patients = patientRepository.findAll();

        for (Patient patient : patients) {
            createFollowUpFromPatient(patient);
        }
    }

    private FollowUp createOrUpdatePendingFollowUp(Patient patient) {
        FollowUp followUp = findPendingFollowUp(patient);

        followUp.setPatientId(
                patient.getPatientId());

        followUp.setPatientName(
                patient.getPatientName());

        followUp.setPhoneNumber(
                patient.getPhoneNumber());

        followUp.setDisease(
                patient.getDisease());

        followUp.setTreatmentStatus(
                patient.getTreatmentStatus());

        followUp.setReceptionistNotes(
                patient.getReceptionistNotes());

        followUp.setPriority(
                calculatePriority(patient));

        if (patient.getFollowupDate() != null
                && !patient.getFollowupDate().isBlank()) {
            followUp.setFollowUpDate(patient.getFollowupDate());
        } else {
            followUp.setFollowUpDate(
                    LocalDate.now()
                            .plusDays(7)
                            .toString());
        }

        followUp.setStatus("PENDING");

        return followUp;
    }

    private FollowUp findPendingFollowUp(Patient patient) {
        if (patient.getPatientId() != null
                && !patient.getPatientId().isBlank()) {
            return followUpRepository
                    .findFirstByPatientIdAndStatusOrderByIdDesc(
                            patient.getPatientId(),
                            "PENDING")
                    .orElseGet(FollowUp::new);
        }

        if (patient.getPhoneNumber() != null
                && !patient.getPhoneNumber().isBlank()) {
            return followUpRepository
                    .findFirstByPhoneNumberAndStatusOrderByIdDesc(
                            patient.getPhoneNumber(),
                            "PENDING")
                    .orElseGet(FollowUp::new);
        }

        return new FollowUp();
    }

    private String calculatePriority(Patient patient) {
        String details = String.join(" ",
                safe(patient.getDisease()),
                safe(patient.getTreatmentStatus()),
                safe(patient.getReceptionistNotes()))
                .toLowerCase(Locale.ROOT);

        if (details.contains("urgent")
                || details.contains("emergency")
                || details.contains("critical")
                || details.contains("surgery")
                || details.contains("severe")
                || details.contains("pain")) {
            return "HIGH";
        }

        LocalDate followUpDate = parseDate(patient.getFollowupDate());

        if (followUpDate != null
                && !followUpDate.isAfter(LocalDate.now().plusDays(2))) {
            return "HIGH";
        }

        if (followUpDate != null
                && !followUpDate.isAfter(LocalDate.now().plusDays(7))) {
            return "MEDIUM";
        }

        if (details.contains("pending")
                || details.contains("active")
                || details.contains("follow")) {
            return "MEDIUM";
        }

        return "LOW";
    }

    private int priorityOrder(FollowUp followUp) {
        String priority = safe(followUp.getPriority()).toUpperCase(Locale.ROOT);

        return switch (priority) {
            case "HIGH" -> 0;
            case "MEDIUM" -> 1;
            case "LOW" -> 2;
            default -> 3;
        };
    }

    private LocalDate followUpDate(FollowUp followUp) {
        LocalDate date = parseDate(followUp.getFollowUpDate());
        return date == null ? LocalDate.MAX : date;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
