package com.clinicai.healthai.controller;

import com.clinicai.healthai.entity.FollowUp;
import com.clinicai.healthai.service.FollowUpService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/followups")
@CrossOrigin(origins = "*")
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(
            FollowUpService followUpService) {

        this.followUpService = followUpService;
    }

    @GetMapping
    public List<FollowUp> getAllFollowUps() {
        return followUpService.getAllUniqueFollowUpsByPriority();
    }
}
