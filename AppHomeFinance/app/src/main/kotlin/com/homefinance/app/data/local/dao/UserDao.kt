package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.homefinance.app.data.local.entity.UserEntity

@Dao
interface UserDao {
    @Query("SELECT COUNT(1) FROM usuarios")
    suspend fun countUsers(): Int

    @Query("SELECT * FROM usuarios WHERE ativo = 1 ORDER BY nome")
    suspend fun listActiveUsers(): List<UserEntity>

    @Query("SELECT * FROM usuarios WHERE email = :email LIMIT 1")
    suspend fun findByEmail(email: String): UserEntity?

    @Query("SELECT * FROM usuarios WHERE id_usuario = :userId LIMIT 1")
    suspend fun findById(userId: Long): UserEntity?

    @Insert
    suspend fun insert(user: UserEntity): Long

    @Update
    suspend fun update(user: UserEntity)
}
