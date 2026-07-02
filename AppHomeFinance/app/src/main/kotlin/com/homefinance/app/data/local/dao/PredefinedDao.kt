package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.homefinance.app.data.local.entity.GastoPredefinidoEntity
import com.homefinance.app.data.local.entity.TipoReceitaEntity

@Dao
interface PredefinedDao {
    @Query("SELECT * FROM gastos_predefinidos WHERE id_usuario = :userId AND ativo = 1 ORDER BY descricao")
    suspend fun listExpenses(userId: Long): List<GastoPredefinidoEntity>

    @Query("SELECT * FROM tipos_receita WHERE id_usuario = :userId AND ativo = 1 ORDER BY descricao")
    suspend fun listRevenues(userId: Long): List<TipoReceitaEntity>

    @Query(
        """
        SELECT * FROM gastos_predefinidos
        WHERE id_usuario = :userId
          AND categoria_id = :categoryId
          AND lower(descricao) = lower(:description)
        LIMIT 1
        """
    )
    suspend fun findExpense(userId: Long, categoryId: Long, description: String): GastoPredefinidoEntity?

    @Query(
        """
        SELECT * FROM tipos_receita
        WHERE id_usuario = :userId
          AND lower(descricao) = lower(:description)
        LIMIT 1
        """
    )
    suspend fun findRevenue(userId: Long, description: String): TipoReceitaEntity?

    @Insert
    suspend fun insertExpense(item: GastoPredefinidoEntity): Long

    @Insert
    suspend fun insertRevenue(item: TipoReceitaEntity): Long

    @Query("SELECT * FROM gastos_predefinidos WHERE id_usuario = :userId AND id = :id LIMIT 1")
    suspend fun findExpenseById(userId: Long, id: Long): GastoPredefinidoEntity?

    @Query("SELECT * FROM tipos_receita WHERE id_usuario = :userId AND id = :id LIMIT 1")
    suspend fun findRevenueById(userId: Long, id: Long): TipoReceitaEntity?

    @Update
    suspend fun updateExpense(item: GastoPredefinidoEntity)

    @Update
    suspend fun updateRevenue(item: TipoReceitaEntity)
}
