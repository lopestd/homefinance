package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index

@Entity(
    tableName = "cartao_faturas_fechadas",
    primaryKeys = ["cartao_id", "orcamento_id", "mes"],
    indices = [
        Index(value = ["id_usuario"])
    ]
)
data class CartaoFaturaFechadaEntity(
    @ColumnInfo(name = "cartao_id")
    val cardId: Long,
    @ColumnInfo(name = "orcamento_id")
    val budgetId: Long,
    @ColumnInfo(name = "mes")
    val month: Int,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

