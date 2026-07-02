package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "lancamentos_cartao",
    indices = [
        Index(value = ["id_usuario", "orcamento_id", "mes_referencia", "cartao_id"])
    ]
)
data class LancamentoCartaoEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "orcamento_id")
    val budgetId: Long,
    @ColumnInfo(name = "cartao_id")
    val cardId: Long,
    @ColumnInfo(name = "categoria_id")
    val categoryId: Long?,
    @ColumnInfo(name = "descricao")
    val description: String,
    @ColumnInfo(name = "complemento")
    val complement: String? = null,
    @ColumnInfo(name = "valor_centavos")
    val amountCents: Long,
    @ColumnInfo(name = "data")
    val dateIso: String,
    @ColumnInfo(name = "mes_referencia")
    val month: Int,
    @ColumnInfo(name = "tipo_recorrencia")
    val recurrenceType: String,
    @ColumnInfo(name = "parcela_atual")
    val installment: Int? = null,
    @ColumnInfo(name = "total_parcelas")
    val totalInstallments: Int? = null,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

