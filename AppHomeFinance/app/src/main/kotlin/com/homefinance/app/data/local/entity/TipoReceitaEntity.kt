package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "tipos_receita",
    indices = [
        Index(value = ["id_usuario", "descricao"], unique = true)
    ]
)
data class TipoReceitaEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "descricao")
    val description: String,
    @ColumnInfo(name = "recorrente", defaultValue = "0")
    val isRecurring: Boolean = false,
    @ColumnInfo(name = "ativo", defaultValue = "1")
    val isActive: Boolean = true,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

