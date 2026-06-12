package com.clinicai.healthai.service;

import com.clinicai.healthai.entity.Patient;
import com.clinicai.healthai.entity.WhatsAppMessage;
import com.clinicai.healthai.repository.PatientRepository;
import com.clinicai.healthai.repository.WhatsAppMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExcelService {

    private final PatientRepository patientRepository;
    private final WhatsAppMessageRepository whatsAppMessageRepository;
    private final FollowUpService followUpService;

    public ExcelService(
            PatientRepository patientRepository,
            WhatsAppMessageRepository whatsAppMessageRepository,
            FollowUpService followUpService) {

        this.patientRepository = patientRepository;
        this.whatsAppMessageRepository = whatsAppMessageRepository;
        this.followUpService = followUpService;
    }

    public void savePatients(List<Patient> patients) {
        List<Patient> savedPatients = patientRepository.saveAll(patients);

        for (Patient patient : savedPatients) {
            followUpService.createFollowUpFromPatient(patient);
        }
    }

    public void saveMessages(List<WhatsAppMessage> messages) {
        whatsAppMessageRepository.saveAll(messages);
    }
}
