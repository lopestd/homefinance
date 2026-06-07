package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "despesas",
    indices = [
        Index(value = ["id_usuario", "orcamento_id"])
    ]
)
data class DespesaEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "id_usuario")
    val userId: Long,
    @ColumnInfo(name = "orcamento_id")
    val budgetId: Long,
    @ColumnInfo(name = "categoria_id")
    val categoryId: Long?,
    @ColumnInfo(name = "descricao")
    val description: String,
    @ColumnInfo(name = "valor_centavos")
    val amountCents: Long,
    @ColumnInfo(name = "status")
    val status: String,
    @ColumnInfo(name = "criado_em")
    val createdAt: String
)

