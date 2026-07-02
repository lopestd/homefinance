package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index

@Entity(
    tableName = "despesas_meses",
    primaryKeys = ["despesa_id", "mes"],
    indices = [
        Index(value = ["id_usuario"])
    ]
)
data class DespesaMesEntity(
    @ColumnInfo(name = "despesa_id")
    val despesaId: Long,
    @ColumnInfo(name = "mes")
    val month: Int,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

