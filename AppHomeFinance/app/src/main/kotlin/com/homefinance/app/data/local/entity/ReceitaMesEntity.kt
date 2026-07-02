package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index

@Entity(
    tableName = "receitas_meses",
    primaryKeys = ["receita_id", "mes"],
    indices = [
        Index(value = ["id_usuario"])
    ]
)
data class ReceitaMesEntity(
    @ColumnInfo(name = "receita_id")
    val receitaId: Long,
    @ColumnInfo(name = "mes")
    val month: Int,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

