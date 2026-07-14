package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.homefinance.app.data.local.entity.CategoriaEntity

@Dao
interface CategoriaDao {
    @Query("SELECT * FROM categorias WHERE id_usuario = :userId AND ativa = 1 ORDER BY tipo, nome")
    suspend fun listByUser(userId: Long): List<CategoriaEntity>

    @Query("SELECT * FROM categorias WHERE id_usuario = :userId AND ativa = 1 AND tipo = :type ORDER BY nome")
    suspend fun listByType(userId: Long, type: String): List<CategoriaEntity>

    @Query(
        """
        SELECT * FROM categorias
        WHERE id_usuario = :userId
          AND tipo = :type
          AND lower(nome) = lower(:name)
        LIMIT 1
        """
    )
    suspend fun findByNameAndType(userId: Long, name: String, type: String): CategoriaEntity?

    @Query("SELECT * FROM categorias WHERE id_usuario = :userId AND id = :id LIMIT 1")
    suspend fun findById(userId: Long, id: Long): CategoriaEntity?

    @Insert
    suspend fun insert(category: CategoriaEntity): Long

    @Update
    suspend fun update(category: CategoriaEntity)

    @Query(
        """
        SELECT EXISTS(
            SELECT 1 FROM receitas
            WHERE id_usuario = :userId AND categoria_id = :categoryId
            UNION ALL
            SELECT 1 FROM despesas
            WHERE id_usuario = :userId AND categoria_id = :categoryId
            UNION ALL
            SELECT 1 FROM lancamentos_cartao
            WHERE id_usuario = :userId AND categoria_id = :categoryId
        )
        """
    )
    suspend fun hasEntries(userId: Long, categoryId: Long): Boolean

}
