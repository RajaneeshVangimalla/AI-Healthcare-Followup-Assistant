package com.clinicai.healthai.repository;

import com.clinicai.healthai.entity.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FollowUpRepository
        extends JpaRepository<FollowUp, Long> {

    Optional<FollowUp> findFirstByPatientIdAndStatusOrderByIdDesc(
            String patientId,
            String status);

    Optional<FollowUp> findFirstByPhoneNumberAndStatusOrderByIdDesc(
            String phoneNumber,
            String status);
}
