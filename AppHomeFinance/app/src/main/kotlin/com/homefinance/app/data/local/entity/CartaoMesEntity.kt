package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "cartao_meses",
    indices = [
        Index(value = ["cartao_id", "orcamento_mes_id"], unique = true),
        Index(value = ["id_usuario"])
    ]
)
data class CartaoMesEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "cartao_id")
    val cardId: Long,
    @ColumnInfo(name = "orcamento_mes_id")
    val budgetMonthId: Long,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

