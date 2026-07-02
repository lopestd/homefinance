package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.homefinance.app.data.local.entity.DespesaMesEntity
import com.homefinance.app.data.local.entity.DespesaEntity

data class DespesaWithCategoriaRow(
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
    val isCardInvoice: Boolean,
    val categoryName: String?
)

@Dao
interface DespesaDao {
    @Query(
        """
        SELECT d.id,
               d.orcamento_id AS budgetId,
               d.categoria_id AS categoryId,
               d.descricao AS description,
               d.complemento AS complement,
               d.valor_centavos AS amountCents,
               d.mes_referencia AS month,
               d.data AS dateIso,
               d.status,
               d.tipo_recorrencia AS recurrenceType,
               d.parcela_atual AS installment,
               d.total_parcelas AS totalInstallments,
               d.fatura_cartao_id IS NOT NULL AS isCardInvoice,
               c.nome AS categoryName
        FROM despesas d
        LEFT JOIN categorias c ON c.id = d.categoria_id
        WHERE d.id_usuario = :userId
          AND (:budgetId IS NULL OR d.orcamento_id = :budgetId)
          AND (:month IS NULL OR d.mes_referencia = :month)
        ORDER BY d.id DESC
        """
    )
    suspend fun listByUser(userId: Long, budgetId: Long?, month: Int? = null): List<DespesaWithCategoriaRow>

    @Insert
    suspend fun insert(despesa: DespesaEntity): Long

    @Insert
    suspend fun insertMonth(despesaMes: DespesaMesEntity)

    @Update
    suspend fun update(despesa: DespesaEntity)

    @Query("SELECT * FROM despesas WHERE id = :id AND id_usuario = :userId LIMIT 1")
    suspend fun findById(userId: Long, id: Long): DespesaEntity?

    @Query(
        """
        SELECT * FROM despesas
        WHERE id_usuario = :userId
          AND fatura_cartao_id = :cardId
          AND fatura_orcamento_id = :budgetId
          AND fatura_mes = :month
        LIMIT 1
        """
    )
    suspend fun findCardInvoiceExpense(
        userId: Long,
        cardId: Long,
        budgetId: Long,
        month: Int
    ): DespesaEntity?

    @Query("DELETE FROM despesas WHERE id = :id AND id_usuario = :userId")
    suspend fun deleteById(userId: Long, id: Long)

    @Query(
        """
        DELETE FROM despesas
        WHERE id_usuario = :userId
          AND fatura_cartao_id = :cardId
          AND fatura_orcamento_id = :budgetId
          AND fatura_mes = :month
          AND status != 'Pago'
        """
    )
    suspend fun deleteOpenCardInvoiceExpense(
        userId: Long,
        cardId: Long,
        budgetId: Long,
        month: Int
    )
}
