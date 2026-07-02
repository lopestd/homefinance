package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "orcamento_meses",
    indices = [
        Index(value = ["orcamento_id", "mes"], unique = true),
        Index(value = ["id_usuario"])
    ]
)
data class OrcamentoMesEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "orcamento_id")
    val budgetId: Long,
    @ColumnInfo(name = "mes")
    val month: Int,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

