package com.clinicai.healthai.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class WhatsAppMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;
    private String patientName;
    private String phoneNumber;
    private String messageDate;

    @Column(length = 5000)
    private String message;
}