package com.clinicai.healthai.repository;

import com.clinicai.healthai.entity.WhatsAppMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WhatsAppMessageRepository
        extends JpaRepository<WhatsAppMessage, Long> {

    List<WhatsAppMessage> findByPhoneNumber(String phoneNumber);

    List<WhatsAppMessage> findTop10ByPhoneNumberOrderByIdDesc(String phoneNumber);

    List<WhatsAppMessage> findTop5ByPhoneNumberOrderByIdDesc(String phoneNumber);
}
