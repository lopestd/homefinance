package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.homefinance.app.data.local.entity.ReceitaMesEntity
import com.homefinance.app.data.local.entity.ReceitaEntity

data class ReceitaWithCategoriaRow(
    val id: Long,
    val budgetId: Long,
    val categoryId: Long?,
    val description: String,
    val complement: String?,
    val amountCents: Long,
    val month: Int,
    val dateIso: String?,
    val status: String,
    val recurrenceType: String,
    val installment: Int?,
    val totalInstallments: Int?,
    val categoryName: String?
)

@Dao
interface ReceitaDao {
    @Query(
        """
        SELECT r.id,
               r.orcamento_id AS budgetId,
               r.categoria_id AS categoryId,
               r.descricao AS description,
               r.complemento AS complement,
               r.valor_centavos AS amountCents,
               r.mes_referencia AS month,
               r.data AS dateIso,
               r.status,
               r.tipo_recorrencia AS recurrenceType,
               r.parcela_atual AS installment,
               r.total_parcelas AS totalInstallments,
               c.nome AS categoryName
        FROM receitas r
        LEFT JOIN categorias c ON c.id = r.categoria_id
        WHERE r.id_usuario = :userId
          AND (:budgetId IS NULL OR r.orcamento_id = :budgetId)
          AND (:month IS NULL OR r.mes_referencia = :month)
        ORDER BY r.id DESC
        """
    )
    suspend fun listByUser(userId: Long, budgetId: Long?, month: Int? = null): List<ReceitaWithCategoriaRow>

    @Insert
    suspend fun insert(receita: ReceitaEntity): Long

    @Insert
    suspend fun insertMonth(receitaMes: ReceitaMesEntity)

    @Update
    suspend fun update(receita: ReceitaEntity)

    @Query("SELECT * FROM receitas WHERE id = :id AND id_usuario = :userId LIMIT 1")
    suspend fun findById(userId: Long, id: Long): ReceitaEntity?

    @Query("DELETE FROM receitas WHERE id = :id AND id_usuario = :userId")
    suspend fun deleteById(userId: Long, id: Long)
}
