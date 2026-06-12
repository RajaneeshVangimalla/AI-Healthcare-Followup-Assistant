package com.clinicai.healthai.controller;

import com.clinicai.healthai.dto.AIAnalysisResponseDTO;
import com.clinicai.healthai.service.PatientSummaryService;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    private final PatientSummaryService summaryService;

    public AIController(PatientSummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @GetMapping("/summary/{phoneNumber}")
    public String getSummary(
            @PathVariable String phoneNumber) {

        return summaryService.generateSummary(phoneNumber);
    }

    @PostMapping("/generate/{patientId}")
    public ResponseEntity<?> generateAnalysis(@PathVariable String patientId) {
        try {
            PatientSummaryService.PatientAnalysis analysis =
                    summaryService.generateAnalysisForPatientId(patientId);

            return ResponseEntity.ok(
                    new AIAnalysisResponseDTO(
                            analysis.brief(),
                            analysis.followUpMessage()));
        } catch (NoSuchElementException ex) {
            return error(HttpStatus.NOT_FOUND, ex.getMessage());
        } catch (IllegalArgumentException ex) {
            return error(HttpStatus.BAD_REQUEST, ex.getMessage());
        } catch (IllegalStateException ex) {
            return error(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
        }
    }

    private ResponseEntity<Map<String, String>> error(
            HttpStatus status,
            String message) {

        return ResponseEntity
                .status(status)
                .body(Map.of("message", message));
    }
}
