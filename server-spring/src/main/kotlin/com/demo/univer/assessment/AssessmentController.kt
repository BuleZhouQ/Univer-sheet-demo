package com.demo.univer.assessment

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/assessment")
class AssessmentController(
    private val assessmentService: AssessmentService,
    private val questionService: QuestionDefinitionService
) {
    @GetMapping("/questions/{id}")
    fun teacherQuestion(@PathVariable id: String) = questionService.get(id)

    @PutMapping("/questions/{id}")
    fun saveQuestion(@PathVariable id: String, @RequestBody question: QuestionDefinition): ResponseEntity<Any> =
        try {
            ResponseEntity.ok(questionService.save(id, question))
        } catch (error: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("message" to error.message))
        }

    @GetMapping("/questions/{id}/student")
    fun studentQuestion(@PathVariable id: String) = questionService.studentView(id)

    @PostMapping("/submit")
    fun submit(@RequestBody request: SubmitAssessmentRequest): ResponseEntity<AssessmentResponse> =
        if (request.cells.size > 500) ResponseEntity.badRequest().build()
        else ResponseEntity.ok(assessmentService.assess(request))
}
