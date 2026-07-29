package com.demo.univer.performance

import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.data.mongodb.repository.Query

interface PerformanceRowRepository : MongoRepository<PerformanceRowDocument, Int> {
    @Query("{ '_id': { '\$gte': ?0, '\$lte': ?1 } }")
    fun findByRowNumberBetweenOrderByRowNumberAsc(startRow: Int, endRow: Int): List<PerformanceRowDocument>
    fun findAllByOrderByRowNumberAsc(): List<PerformanceRowDocument>
}
