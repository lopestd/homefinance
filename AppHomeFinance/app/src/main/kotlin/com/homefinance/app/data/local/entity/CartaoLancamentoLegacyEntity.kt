package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "cartao_lancamentos",
    indices = [
        Index(value = ["cartao_mes_id"]),
        Index(value = ["id_usuario"])
    ]
)
data class CartaoLancamentoLegacyEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "cartao_mes_id")
    val cardMonthId: Long,
    @ColumnInfo(name = "descricao")
    val description: String,
    @ColumnInfo(name = "valor_centavos")
    val amountCents: Long,
    @ColumnInfo(name = "tipo_recorrencia")
    val recurrenceType: String,
    @ColumnInfo(name = "paga", defaultValue = "0")
    val isPaid: Boolean = false,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

