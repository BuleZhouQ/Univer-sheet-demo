package com.demo.univer.performance

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/performance")
class PerformanceDataController(private val service: PerformanceDataService) {
    @GetMapping("/snapshot")
    fun snapshot(): ResponseEntity<PerformanceRowsResponse> = ResponseEntity.ok(service.snapshot())

    @GetMapping("/rows")
    fun rows(@RequestParam(defaultValue = "0") offset: Int, @RequestParam(defaultValue = "200") limit: Int): ResponseEntity<PerformanceRowsResponse> {
        if (offset !in 0..99_999 || limit !in 1..200) return ResponseEntity.badRequest().build()
        return ResponseEntity.ok(PerformanceRowsResponse(rows = service.rows(offset, limit)))
    }
}
