package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.Upsert
import com.homefinance.app.data.local.entity.CartaoEntity
import com.homefinance.app.data.local.entity.CartaoFaturaFechadaEntity
import com.homefinance.app.data.local.entity.CartaoLimiteMensalEntity
import com.homefinance.app.data.local.entity.LancamentoCartaoEntity
import com.homefinance.app.data.local.entity.LancamentoCartaoMesEntity

data class LancamentoCartaoRow(
    val id: Long,
    val budgetId: Long,
    val cardId: Long,
    val cardName: String,
    val categoryId: Long?,
    val categoryName: String?,
    val description: String,
    val complement: String?,
    val amountCents: Long,
    val dateIso: String,
    val month: Int,
    val recurrenceType: String,
    val installment: Int?,
    val totalInstallments: Int?
)

@Dao
interface CartaoDao {
    @Query("SELECT * FROM cartoes WHERE id_usuario = :userId AND ativo = 1 ORDER BY nome")
    suspend fun listCards(userId: Long): List<CartaoEntity>

    @Query("SELECT * FROM cartoes WHERE id_usuario = :userId AND id = :cardId LIMIT 1")
    suspend fun findCard(userId: Long, cardId: Long): CartaoEntity?

    @Query(
        """
        SELECT * FROM cartoes
        WHERE id_usuario = :userId
          AND lower(nome) = lower(:name)
        LIMIT 1
        """
    )
    suspend fun findCardByName(userId: Long, name: String): CartaoEntity?

    @Insert
    suspend fun insertCard(card: CartaoEntity): Long

    @Update
    suspend fun updateCard(card: CartaoEntity)

    @Query(
        """
        SELECT l.id,
               l.orcamento_id AS budgetId,
               l.cartao_id AS cardId,
               ca.nome AS cardName,
               l.categoria_id AS categoryId,
               c.nome AS categoryName,
               l.descricao AS description,
               l.complemento AS complement,
               l.valor_centavos AS amountCents,
               l.data AS dateIso,
               l.mes_referencia AS month,
               l.tipo_recorrencia AS recurrenceType,
               l.parcela_atual AS installment,
               l.total_parcelas AS totalInstallments
        FROM lancamentos_cartao l
        INNER JOIN cartoes ca ON ca.id = l.cartao_id
        LEFT JOIN categorias c ON c.id = l.categoria_id
        WHERE l.id_usuario = :userId
          AND (:budgetId IS NULL OR l.orcamento_id = :budgetId)
          AND (:month IS NULL OR l.mes_referencia = :month)
          AND (:cardId IS NULL OR l.cartao_id = :cardId)
        ORDER BY l.id DESC
        """
    )
    suspend fun listCharges(
        userId: Long,
        budgetId: Long?,
        month: Int? = null,
        cardId: Long? = null
    ): List<LancamentoCartaoRow>

    @Query("SELECT * FROM lancamentos_cartao WHERE id_usuario = :userId AND id = :chargeId LIMIT 1")
    suspend fun findCharge(userId: Long, chargeId: Long): LancamentoCartaoEntity?

    @Insert
    suspend fun insertCharge(charge: LancamentoCartaoEntity): Long

    @Update
    suspend fun updateCharge(charge: LancamentoCartaoEntity)

    @Insert
    suspend fun insertChargeMonth(month: LancamentoCartaoMesEntity)

    @Query("DELETE FROM lancamentos_cartao WHERE id_usuario = :userId AND id = :chargeId")
    suspend fun deleteCharge(userId: Long, chargeId: Long)

    @Query(
        """
        SELECT COUNT(*) FROM lancamentos_cartao
        WHERE id_usuario = :userId
          AND cartao_id = :cardId
          AND orcamento_id = :budgetId
          AND mes_referencia = :month
        """
    )
    suspend fun countChargesForInvoice(userId: Long, cardId: Long, budgetId: Long, month: Int): Int

    @Query(
        """
        SELECT COALESCE(SUM(CASE
            WHEN descricao LIKE '[CREDITO]%' THEN -valor_centavos
            ELSE valor_centavos
        END), 0)
        FROM lancamentos_cartao
        WHERE id_usuario = :userId
          AND cartao_id = :cardId
          AND orcamento_id = :budgetId
          AND mes_referencia = :month
        """
    )
    suspend fun invoiceTotalCents(userId: Long, cardId: Long, budgetId: Long, month: Int): Long

    @Query(
        """
        SELECT EXISTS(
            SELECT 1 FROM cartao_faturas_fechadas
            WHERE id_usuario = :userId
              AND cartao_id = :cardId
              AND orcamento_id = :budgetId
              AND mes = :month
        )
        """
    )
    suspend fun isInvoiceClosed(userId: Long, cardId: Long, budgetId: Long, month: Int): Boolean

    @Query("SELECT * FROM cartao_faturas_fechadas WHERE id_usuario = :userId")
    suspend fun listClosedInvoices(userId: Long): List<CartaoFaturaFechadaEntity>

    @Insert
    suspend fun insertClosedInvoice(invoice: CartaoFaturaFechadaEntity)

    @Query(
        """
        DELETE FROM cartao_faturas_fechadas
        WHERE id_usuario = :userId
          AND cartao_id = :cardId
          AND orcamento_id = :budgetId
          AND mes = :month
        """
    )
    suspend fun deleteClosedInvoice(userId: Long, cardId: Long, budgetId: Long, month: Int)

    @Query("SELECT * FROM cartao_limites_mensais WHERE id_usuario = :userId")
    suspend fun listLimits(userId: Long): List<CartaoLimiteMensalEntity>

    @Query(
        """
        SELECT * FROM cartao_limites_mensais
        WHERE id_usuario = :userId
          AND cartao_id = :cardId
          AND orcamento_id = :budgetId
          AND mes = :month
        LIMIT 1
        """
    )
    suspend fun findLimit(userId: Long, cardId: Long, budgetId: Long, month: Int): CartaoLimiteMensalEntity?

    @Upsert
    suspend fun upsertLimit(limit: CartaoLimiteMensalEntity)
}
