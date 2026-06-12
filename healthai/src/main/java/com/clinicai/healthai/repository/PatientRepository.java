package com.clinicai.healthai.repository;

import com.clinicai.healthai.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, String> {

    Optional<Patient> findByPhoneNumber(String phoneNumber);

    List<Patient> findByFollowupDateOrderByPatientNameAsc(String followupDate);
}
