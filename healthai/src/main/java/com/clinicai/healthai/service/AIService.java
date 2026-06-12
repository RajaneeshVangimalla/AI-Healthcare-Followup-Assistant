package com.clinicai.healthai.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    public static final String NOT_CONFIGURED_MESSAGE =
            "AI service is not configured. Please set gemini.api-key before generating summaries.";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${gemini.api-base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    public AIService(
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {

        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public String generateSummary(String prompt) {
        if (!isConfigured()) {
            log.warn("Gemini request skipped because AI configuration is missing");
            return NOT_CONFIGURED_MESSAGE;
        }

        if (prompt == null || prompt.isBlank()) {
            log.warn("Gemini request skipped because prompt is blank");
            return "AI Error: Prompt is empty.";
        }

        String configuredBaseUrl = clean(baseUrl);
        String configuredModel = clean(model);
        String configuredApiKey = clean(apiKey);

        try {
            String url = configuredBaseUrl
                    + "/models/"
                    + configuredModel
                    + ":generateContent?key="
                    + configuredApiKey;

            Map<String, Object> request = Map.of(
                    "contents",
                    new Object[]{
                        Map.of(
                                "parts",
                                new Object[]{
                                    Map.of("text", prompt)
                                }
                        )
                    },
                    "generationConfig",
                    Map.of(
                            "temperature", 0.3,
                            "maxOutputTokens", 1200,
                            "topP", 0.95,
                            "topK", 40,
                            "responseMimeType", "application/json"
                    )
            );
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            log.info("Sending Gemini summary request using model {}", configuredModel);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    url,
                    entity,
                    String.class
            );
            log.info("Gemini summary request completed with status {}", response.getStatusCode());
            return extractResponse(response.getBody());
        } catch (RestClientException e) {
            log.error("Gemini request failed", e);
            return "AI Error: Gemini request failed. Please verify the API key, model, and network access.";
        } catch (Exception e) {
            log.error("Unexpected Gemini integration error", e);
            return "AI Error: Unable to generate summary at this time.";
        }
    }

    private String extractResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            log.warn("Gemini returned an empty response body");
            return "No response returned from Gemini";
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode errorMessage = root.path("error").path("message");

            if (!errorMessage.isMissingNode() && !errorMessage.asText("").isBlank()) {
                log.warn("Gemini returned an error response: {}", errorMessage.asText());
                return "AI Error: " + errorMessage.asText();
            }

            JsonNode candidates = root.path("candidates");

            if (candidates.isMissingNode()
                    || candidates.isEmpty()) {
                log.warn("Gemini response did not contain candidates");
                return "No response returned from Gemini";
            }

            String text = candidates
                    .get(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText("");

            if (text.isBlank()) {
                log.warn("Gemini response did not contain summary text");
                return "No summary text returned from Gemini";
            }

            return text;
        } catch (Exception e) {
            log.error("Failed to parse Gemini response", e);
            return "Failed to parse Gemini response";
        }
    }

    public boolean isConfigured() {
        return !clean(apiKey).isBlank()
                && !clean(model).isBlank()
                && !clean(baseUrl).isBlank();
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
