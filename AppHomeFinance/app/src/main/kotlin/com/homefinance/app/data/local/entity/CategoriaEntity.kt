package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "categorias",
    indices = [
        Index(value = ["id_usuario", "tipo", "nome"], unique = true)
    ]
)
data class CategoriaEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "id_usuario")
    val userId: Long,
    @ColumnInfo(name = "nome")
    val name: String,
    @ColumnInfo(name = "tipo")
    val type: String,
    @ColumnInfo(name = "ativa")
    val isActive: Boolean = true
)

