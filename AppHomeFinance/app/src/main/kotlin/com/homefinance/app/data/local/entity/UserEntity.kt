package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "usuarios",
    indices = [
        Index(value = ["email"], unique = true)
    ]
)
data class UserEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id_usuario")
    val id: Long = 0L,
    @ColumnInfo(name = "nome")
    val displayName: String,
    @ColumnInfo(name = "email")
    val email: String,
    @ColumnInfo(name = "senha_hash")
    val passwordHash: String,
    @ColumnInfo(name = "salt")
    val salt: String,
    @ColumnInfo(name = "ativo")
    val isActive: Boolean = true,
    @ColumnInfo(name = "data_criacao")
    val createdAt: String,
    @ColumnInfo(name = "data_atualizacao")
    val updatedAt: String? = null
)

