package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index

@Entity(
    tableName = "cartao_limites_mensais",
    primaryKeys = ["cartao_id", "orcamento_id", "mes"],
    indices = [
        Index(value = ["id_usuario"])
    ]
)
data class CartaoLimiteMensalEntity(
    @ColumnInfo(name = "cartao_id")
    val cardId: Long,
    @ColumnInfo(name = "orcamento_id")
    val budgetId: Long,
    @ColumnInfo(name = "mes")
    val month: Int,
    @ColumnInfo(name = "limite_centavos")
    val limitCents: Long,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

