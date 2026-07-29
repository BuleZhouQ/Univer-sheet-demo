package com.demo.univer.performance

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document

@Document("performance_rows")
data class PerformanceRowDocument(
    @Id
    val rowNumber: Int,
    val values: List<Any>
)
