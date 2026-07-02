package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "gastos_predefinidos",
    indices = [
        Index(value = ["id_usuario", "categoria_id", "descricao"], unique = true)
    ]
)
data class GastoPredefinidoEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "categoria_id")
    val categoryId: Long,
    @ColumnInfo(name = "descricao")
    val description: String,
    @ColumnInfo(name = "ativo", defaultValue = "1")
    val isActive: Boolean = true,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

