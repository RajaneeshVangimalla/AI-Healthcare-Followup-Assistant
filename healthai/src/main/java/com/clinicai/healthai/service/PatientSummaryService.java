package com.clinicai.healthai.service;

import com.clinicai.healthai.entity.Patient;
import com.clinicai.healthai.entity.WhatsAppMessage;
import com.clinicai.healthai.repository.PatientRepository;
import com.clinicai.healthai.repository.WhatsAppMessageRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;

@Service
public class PatientSummaryService {

    private static final int MAX_MESSAGE_LENGTH = 160;

    private final PatientRepository patientRepository;
    private final WhatsAppMessageRepository messageRepository;
    private final AIService aiService;
    private final FollowUpService followUpService;
    private final ObjectMapper objectMapper;

    public PatientSummaryService(
            PatientRepository patientRepository,
            WhatsAppMessageRepository messageRepository,
            AIService aiService,
            FollowUpService followUpService,
            ObjectMapper objectMapper) {

        this.patientRepository = patientRepository;
        this.messageRepository = messageRepository;
        this.aiService = aiService;
        this.followUpService = followUpService;
        this.objectMapper = objectMapper;
    }

    public String generateSummary(String phoneNumber) {
        Patient patient = patientRepository
                .findByPhoneNumber(phoneNumber)
                .orElse(null);

        if (patient == null) {
            return "Patient not found";
        }

        PatientAnalysis analysis = generateAnalysis(patient);
        return analysis.toDisplayText();
    }

    public PatientAnalysis generateAnalysis(Patient patient) {
        List<WhatsAppMessage> messages
                = messageRepository.findTop5ByPhoneNumberOrderByIdDesc(
                        patient.getPhoneNumber());
        Collections.reverse(messages);

        String aiResponse = aiService.generateSummary(
                buildAnalysisPrompt(patient, messages));

        if (Objects.equals(AIService.NOT_CONFIGURED_MESSAGE, aiResponse)) {
            return new PatientAnalysis(
                    AIService.NOT_CONFIGURED_MESSAGE,
                    fallbackFollowUpMessage(patient));
        }

        PatientAnalysis analysis = parseAnalysis(aiResponse, patient);

        followUpService.createFollowUp(
                patient,
                analysis.patientBrief());

        return analysis;
    }

    public PatientAnalysis generateAnalysisForPatientId(String patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NoSuchElementException("Patient not found."));

        validatePatientForAi(patient);

        List<WhatsAppMessage> messages
                = messageRepository.findTop10ByPhoneNumberOrderByIdDesc(
                        patient.getPhoneNumber());
        Collections.reverse(messages);

        if (!aiService.isConfigured()) {
            throw new IllegalStateException(AIService.NOT_CONFIGURED_MESSAGE);
        }

        PatientAnalysis analysis = requestUsableAnalysis(patient, messages);

        followUpService.createFollowUp(
                patient,
                analysis.brief());

        return analysis;
    }

    private PatientAnalysis requestUsableAnalysis(
            Patient patient,
            List<WhatsAppMessage> messages) {

        String prompt = buildAnalysisPrompt(patient, messages);
        String lastResponse = "";

        for (int attempt = 0; attempt < 2; attempt++) {
            String aiResponse = aiService.generateSummary(prompt);
            lastResponse = aiResponse;

            if (aiResponse == null || aiResponse.isBlank()) {
                continue;
            }

            if (aiResponse.startsWith("AI Error:")
                    || aiResponse.startsWith("No response")
                    || aiResponse.startsWith("Failed to parse")) {
                throw new IllegalStateException(aiResponse);
            }

            PatientAnalysis analysis = parseAnalysis(aiResponse, patient);

            if (isUsableAnalysis(analysis, patient)) {
                return analysis;
            }

            prompt = buildRepairPrompt(patient, messages, aiResponse);
        }

        throw new IllegalStateException(
                "AI service returned an incomplete summary. Please try again.");
    }

    private String buildAnalysisPrompt(
            Patient patient,
            List<WhatsAppMessage> messages) {

        StringBuilder prompt = new StringBuilder();

        prompt.append("""
            You are an experienced Healthcare Follow-Up Assistant working for a clinic.

            Your task is to analyze the patient's details and WhatsApp conversation history
            and generate a professional follow-up briefing for the receptionist.

            Instructions:
            - Analyze the patient's medical condition, treatment status, and WhatsApp communication.
            - Focus on information useful for a follow-up call.
            - Identify concerns, symptoms, missed appointments, treatment adherence, and patient engagement.
            - Determine the patient's overall attitude toward treatment.
            - Generate a patient briefing around 100 words.
            - Summarize the medical condition, follow-up status, treatment progress, concerns raised in WhatsApp chats, and overall patient situation.
            - Generate a WhatsApp follow-up message between 30 and 50 words.
            - Make the WhatsApp message friendly, professional, clinic-oriented, and ready to send to the patient.
            - The summary should help the receptionist quickly understand the patient's situation before calling.
            - Write in professional healthcare language.
            - Do not provide a medical diagnosis.
            - Return valid JSON only.
            - Do not wrap the JSON in markdown.

            Patient Information:
            """)
                .append("Patient Name: ")
                .append(patient.getPatientName())
                .append("\n")
                .append("Disease: ")
                .append(patient.getDisease())
                .append("\n")
                .append("Treatment Status: ")
                .append(patient.getTreatmentStatus())
                .append("\n")
                .append("Follow-up Date: ")
                .append(patient.getFollowupDate())
                .append("\n")
                .append("Receptionist Notes: ")
                .append(patient.getReceptionistNotes())
                .append("\n\n");

        prompt.append("WhatsApp Conversation:\n");

        if (messages.isEmpty()) {
            prompt.append("No recent WhatsApp messages available.\n");
        } else {
            for (WhatsAppMessage msg : messages) {
                prompt.append("- ")
                        .append(limitMessage(msg.getMessage()))
                        .append("\n");
            }
        }

        prompt.append("""

            Return exactly this JSON shape:
            {
              "brief": "Around 100 words in professional healthcare language.",
              "followUpMessage": "30-50 word professional WhatsApp message ready to send directly to the patient."
            }
            """);

        return prompt.toString();
    }

    private String buildRepairPrompt(
            Patient patient,
            List<WhatsAppMessage> messages,
            String previousResponse) {

        return buildAnalysisPrompt(patient, messages)
                + "\nThe previous response was incomplete. Return complete valid JSON only. Previous response:\n"
                + previousResponse;
    }

    private PatientAnalysis parseAnalysis(
            String aiResponse,
            Patient patient) {

        Map<String, String> fields = parseLabeledFields(aiResponse);
        Map<String, String> jsonFields = parseJsonFields(aiResponse);

        String patientBrief = firstPresent(
                jsonFields,
                "brief",
                firstPresent(jsonFields, "patientBrief",
                        firstPresent(jsonFields, "patient brief", "")));
        patientBrief = firstPresent(
                fields,
                "patient brief",
                patientBrief);

        String followUpMessage = firstPresent(
                jsonFields,
                "followUpMessage",
                firstPresent(jsonFields, "follow-up message",
                        firstPresent(jsonFields, "follow up message", "")));
        followUpMessage = firstPresent(
                fields,
                "follow-up message",
                firstPresent(fields, "follow up message", followUpMessage));

        return new PatientAnalysis(
                usableOrFallback(patientBrief, fallbackPatientBrief(aiResponse)),
                usableOrFallback(followUpMessage, fallbackFollowUpMessage(patient)));
    }

    private String usableOrFallback(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);

        if (normalized.equals("patient brief:")
                || normalized.equals("follow-up message:")
                || normalized.equals("follow up message:")) {
            return fallback;
        }

        return value.trim();
    }

    private Map<String, String> parseLabeledFields(String text) {
        Map<String, String> fields = new LinkedHashMap<>();

        if (text == null || text.isBlank()) {
            return fields;
        }

        String currentLabel = null;
        StringBuilder currentValue = new StringBuilder();

        for (String line : text.split("\\R")) {
            String trimmedLine = line.trim();

            if (trimmedLine.isBlank()) {
                continue;
            }

            String label = labelFrom(trimmedLine);

            if (label != null) {
                if (currentLabel != null) {
                    fields.put(currentLabel, currentValue.toString().trim());
                }

                currentLabel = label;
                currentValue = new StringBuilder(valueAfterLabel(trimmedLine));
            } else if (currentLabel != null) {
                if (!currentValue.isEmpty()) {
                    currentValue.append("\n");
                }
                currentValue.append(cleanFieldValue(trimmedLine));
            }
        }

        if (currentLabel != null) {
            fields.put(currentLabel, currentValue.toString().trim());
        }

        return fields;
    }

    private Map<String, String> parseJsonFields(String text) {
        Map<String, String> fields = new LinkedHashMap<>();

        if (text == null || text.isBlank()) {
            return fields;
        }

        try {
            JsonNode root = objectMapper.readTree(extractJson(text));

            copyTextField(root, fields, "brief");
            copyTextField(root, fields, "patientBrief");
            copyTextField(root, fields, "patient brief");
            copyTextField(root, fields, "followUpMessage");
            copyTextField(root, fields, "follow-up message");
            copyTextField(root, fields, "follow up message");
        } catch (Exception ignored) {
            return fields;
        }

        return fields;
    }

    private void copyTextField(
            JsonNode root,
            Map<String, String> fields,
            String name) {

        String value = root.path(name).asText("");

        if (!value.isBlank()) {
            fields.put(name, value.trim());
        }
    }

    private String extractJson(String text) {
        String cleaned = text.trim();

        if (cleaned.startsWith("```")) {
            cleaned = cleaned
                    .replaceFirst("^```[a-zA-Z]*\\s*", "")
                    .replaceFirst("\\s*```$", "")
                    .trim();
        }

        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');

        if (start >= 0 && end > start) {
            return cleaned.substring(start, end + 1);
        }

        return cleaned;
    }

    private String labelFrom(String line) {
        String normalizedLine = normalizeLabel(line);

        if (normalizedLine.equals("patient brief")
                || normalizedLine.startsWith("patient brief:")) {
            return "patient brief";
        }

        if (normalizedLine.equals("follow-up message")
                || normalizedLine.equals("follow up message")
                || normalizedLine.startsWith("follow-up message:")
                || normalizedLine.startsWith("follow up message:")) {
            return "follow-up message";
        }

        return null;
    }

    private String valueAfterLabel(String line) {
        int colonIndex = line.indexOf(':');

        if (colonIndex < 0) {
            return "";
        }

        return cleanFieldValue(line.substring(colonIndex + 1));
    }

    private String cleanFieldValue(String value) {
        String cleaned = value == null ? "" : value.trim();

        while (cleaned.startsWith("*")) {
            cleaned = cleaned.substring(1).trim();
        }

        while (cleaned.endsWith("*")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1).trim();
        }

        return cleaned;
    }

    private String normalizeLabel(String value) {
        String label = value
                .trim()
                .toLowerCase(Locale.ROOT);

        while (!label.isBlank()
                && !Character.isLetterOrDigit(label.charAt(0))) {
            label = label.substring(1).trim();
        }

        while (!label.isBlank()
                && !Character.isLetterOrDigit(label.charAt(label.length() - 1))) {
            label = label.substring(0, label.length() - 1).trim();
        }

        return label
                .replace('\u2010', '-')
                .replace('\u2011', '-')
                .replace('\u2012', '-')
                .replace('\u2013', '-')
                .replace('\u2014', '-');
    }

    private String firstPresent(
            Map<String, String> fields,
            String label,
            String fallback) {

        String value = fields.get(label);
        return value == null || value.isBlank()
                ? fallback
                : value;
    }

    private String limitMessage(String message) {
        if (message == null) {
            return "";
        }

        if (message.length() <= MAX_MESSAGE_LENGTH) {
            return message;
        }

        return message.substring(0, MAX_MESSAGE_LENGTH) + "...";
    }

    private String fallbackFollowUpMessage(Patient patient) {
        return """
                Hello %s, we are following up about your treatment and would like to know how you are feeling. Please let us know if you have any concerns, new symptoms, or difficulty continuing your treatment plan. Your response will help the clinic support your care and prepare for your next follow-up. Kindly reply when convenient so we can assist you further.
                """.formatted(
                patient.getPatientName() == null || patient.getPatientName().isBlank()
                        ? "there"
                        : patient.getPatientName()).trim();
    }

    private String fallbackPatientBrief(String aiResponse) {
        if (aiResponse != null && !aiResponse.isBlank()) {
            return aiResponse.trim();
        }

        return "AI did not return a usable patient brief.";
    }

    private boolean isUsableAnalysis(PatientAnalysis analysis, Patient patient) {
        return analysis != null
                && !isBlank(analysis.brief())
                && !analysis.brief().trim().startsWith("{")
                && wordCount(analysis.brief()) >= 25
                && !isBlank(analysis.followUpMessage())
                && !analysis.followUpMessage().equals(fallbackFollowUpMessage(patient))
                && wordCount(analysis.followUpMessage()) >= 20
                && wordCount(analysis.followUpMessage()) <= 70;
    }

    private int wordCount(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }

        return value.trim().split("\\s+").length;
    }

    private void validatePatientForAi(Patient patient) {
        if (patient == null) {
            throw new IllegalArgumentException("Patient data is empty.");
        }

        if (isBlank(patient.getPatientName())
                && isBlank(patient.getPhoneNumber())
                && isBlank(patient.getDisease())
                && isBlank(patient.getTreatmentStatus())
                && isBlank(patient.getReceptionistNotes())) {
            throw new IllegalArgumentException("Patient data is empty.");
        }

        if (isBlank(patient.getPhoneNumber())) {
            throw new IllegalArgumentException("Patient phone number is missing.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record PatientAnalysis(
            String brief,
            String followUpMessage) {

        public String patientBrief() {
            return brief;
        }

        public String toDisplayText() {
            return """
                    Patient Brief: %s
                    Follow-Up Message: %s
                    """.formatted(
                    brief,
                    followUpMessage).trim();
        }
    }
}
