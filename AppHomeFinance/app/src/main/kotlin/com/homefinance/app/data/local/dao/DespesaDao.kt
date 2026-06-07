package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.homefinance.app.data.local.entity.DespesaEntity

data class DespesaWithCategoriaRow(
    val id: Long,
    val orcamento_id: Long,
    val descricao: String,
    val valor_centavos: Long,
    val status: String,
    val categoria_nome: String?
)

@Dao
interface DespesaDao {
    @Query(
        """
        SELECT d.id,
               d.orcamento_id,
               d.descricao,
               d.valor_centavos,
               d.status,
               c.nome AS categoria_nome
        FROM despesas d
        LEFT JOIN categorias c ON c.id = d.categoria_id
        WHERE d.id_usuario = :userId
          AND (:budgetId IS NULL OR d.orcamento_id = :budgetId)
        ORDER BY d.id DESC
        """
    )
    suspend fun listByUser(userId: Long, budgetId: Long?): List<DespesaWithCategoriaRow>

    @Insert
    suspend fun insert(despesa: DespesaEntity): Long

    @Update
    suspend fun update(despesa: DespesaEntity)

    @Query("SELECT * FROM despesas WHERE id = :id AND id_usuario = :userId LIMIT 1")
    suspend fun findById(userId: Long, id: Long): DespesaEntity?

    @Query("DELETE FROM despesas WHERE id = :id AND id_usuario = :userId")
    suspend fun deleteById(userId: Long, id: Long)
}

