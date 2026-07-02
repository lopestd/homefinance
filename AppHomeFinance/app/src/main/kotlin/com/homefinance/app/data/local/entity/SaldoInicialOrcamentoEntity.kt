package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "saldo_inicial_orcamento",
    indices = [
        Index(value = ["id_usuario", "orcamento_id", "ano"], unique = true)
    ]
)
data class SaldoInicialOrcamentoEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "id_usuario")
    val userId: Long,
    @ColumnInfo(name = "orcamento_id")
    val budgetId: Long,
    @ColumnInfo(name = "ano")
    val year: Int,
    @ColumnInfo(name = "saldo_inicial_centavos", defaultValue = "0")
    val initialBalanceCents: Long = 0L,
    @ColumnInfo(name = "criado_em")
    val createdAt: String,
    @ColumnInfo(name = "atualizado_em")
    val updatedAt: String? = null
)

