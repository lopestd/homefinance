package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.Upsert
import com.homefinance.app.data.local.entity.OrcamentoEntity
import com.homefinance.app.data.local.entity.OrcamentoMesEntity
import com.homefinance.app.data.local.entity.SaldoInicialOrcamentoEntity

@Dao
interface OrcamentoDao {
    @Query("SELECT * FROM orcamentos WHERE id_usuario = :userId ORDER BY ano DESC")
    suspend fun listByUser(userId: Long): List<OrcamentoEntity>

    @Query("SELECT * FROM orcamentos WHERE id_usuario = :userId AND ano = :year LIMIT 1")
    suspend fun findByYear(userId: Long, year: Int): OrcamentoEntity?

    @Query("SELECT * FROM orcamentos WHERE id_usuario = :userId AND id = :budgetId LIMIT 1")
    suspend fun findById(userId: Long, budgetId: Long): OrcamentoEntity?

    @Insert
    suspend fun insert(orcamento: OrcamentoEntity): Long

    @Update
    suspend fun update(orcamento: OrcamentoEntity)

    @Insert
    suspend fun insertMonth(month: OrcamentoMesEntity)

    @Query("SELECT mes FROM orcamento_meses WHERE orcamento_id = :budgetId AND id_usuario = :userId ORDER BY mes")
    suspend fun listMonths(userId: Long, budgetId: Long): List<Int>

    @Query("SELECT * FROM saldo_inicial_orcamento WHERE id_usuario = :userId AND orcamento_id = :budgetId LIMIT 1")
    suspend fun findInitialBalance(userId: Long, budgetId: Long): SaldoInicialOrcamentoEntity?

    @Query("SELECT * FROM saldo_inicial_orcamento WHERE id_usuario = :userId")
    suspend fun listInitialBalances(userId: Long): List<SaldoInicialOrcamentoEntity>

    @Upsert
    suspend fun upsertInitialBalance(balance: SaldoInicialOrcamentoEntity)

    @Query(
        """
        SELECT EXISTS(
            SELECT 1 FROM receitas
            WHERE id_usuario = :userId AND orcamento_id = :budgetId
            UNION ALL
            SELECT 1 FROM despesas
            WHERE id_usuario = :userId
              AND (orcamento_id = :budgetId OR fatura_orcamento_id = :budgetId)
            UNION ALL
            SELECT 1 FROM lancamentos_cartao
            WHERE id_usuario = :userId AND orcamento_id = :budgetId
        )
        """
    )
    suspend fun hasEntries(userId: Long, budgetId: Long): Boolean

    @Query("DELETE FROM orcamento_meses WHERE id_usuario = :userId AND orcamento_id = :budgetId")
    suspend fun deleteMonthsByBudget(userId: Long, budgetId: Long)

    @Query("DELETE FROM saldo_inicial_orcamento WHERE id_usuario = :userId AND orcamento_id = :budgetId")
    suspend fun deleteInitialBalanceByBudget(userId: Long, budgetId: Long)

    @Query("DELETE FROM orcamentos WHERE id_usuario = :userId AND id = :budgetId")
    suspend fun deleteById(userId: Long, budgetId: Long)
}
