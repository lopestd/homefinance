package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "orcamentos",
    indices = [
        Index(value = ["id_usuario", "ano"], unique = true)
    ]
)
data class OrcamentoEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "id_usuario")
    val userId: Long,
    @ColumnInfo(name = "ano")
    val year: Int,
    @ColumnInfo(name = "ativo")
    val isActive: Boolean = true,
    @ColumnInfo(name = "criado_em")
    val createdAt: String
)

