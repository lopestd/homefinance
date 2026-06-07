package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.homefinance.app.data.local.entity.OrcamentoEntity

@Dao
interface OrcamentoDao {
    @Query("SELECT * FROM orcamentos WHERE id_usuario = :userId ORDER BY ano DESC")
    suspend fun listByUser(userId: Long): List<OrcamentoEntity>

    @Query("SELECT * FROM orcamentos WHERE id_usuario = :userId AND ano = :year LIMIT 1")
    suspend fun findByYear(userId: Long, year: Int): OrcamentoEntity?

    @Insert
    suspend fun insert(orcamento: OrcamentoEntity): Long

    @Query("DELETE FROM orcamentos WHERE id_usuario = :userId AND id = :budgetId")
    suspend fun deleteById(userId: Long, budgetId: Long)
}
