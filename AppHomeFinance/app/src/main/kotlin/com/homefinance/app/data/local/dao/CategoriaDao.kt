package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.homefinance.app.data.local.entity.CategoriaEntity

@Dao
interface CategoriaDao {
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

    @Insert
    suspend fun insert(category: CategoriaEntity): Long
}
