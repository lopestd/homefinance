package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.homefinance.app.data.local.entity.ReceitaEntity

data class ReceitaWithCategoriaRow(
    val id: Long,
    val orcamento_id: Long,
    val descricao: String,
    val valor_centavos: Long,
    val status: String,
    val categoria_nome: String?
)

@Dao
interface ReceitaDao {
    @Query(
        """
        SELECT r.id,
               r.orcamento_id,
               r.descricao,
               r.valor_centavos,
               r.status,
               c.nome AS categoria_nome
        FROM receitas r
        LEFT JOIN categorias c ON c.id = r.categoria_id
        WHERE r.id_usuario = :userId
          AND (:budgetId IS NULL OR r.orcamento_id = :budgetId)
        ORDER BY r.id DESC
        """
    )
    suspend fun listByUser(userId: Long, budgetId: Long?): List<ReceitaWithCategoriaRow>

    @Insert
    suspend fun insert(receita: ReceitaEntity): Long

    @Update
    suspend fun update(receita: ReceitaEntity)

    @Query("SELECT * FROM receitas WHERE id = :id AND id_usuario = :userId LIMIT 1")
    suspend fun findById(userId: Long, id: Long): ReceitaEntity?

    @Query("DELETE FROM receitas WHERE id = :id AND id_usuario = :userId")
    suspend fun deleteById(userId: Long, id: Long)
}

