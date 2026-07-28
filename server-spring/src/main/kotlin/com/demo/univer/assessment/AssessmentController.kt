package com.demo.univer.assessment

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/assessment")
class AssessmentController(private val service: AssessmentService) {
    @PostMapping("/submit")
    fun submit(@RequestBody request: SubmitAssessmentRequest): ResponseEntity<AssessmentResponse> =
        if (request.cells.size > 100) ResponseEntity.badRequest().build() else ResponseEntity.ok(service.assess(request))
}
