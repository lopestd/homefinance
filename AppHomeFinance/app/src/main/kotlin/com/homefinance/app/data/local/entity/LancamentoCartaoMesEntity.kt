package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index

@Entity(
    tableName = "lancamentos_cartao_meses",
    primaryKeys = ["lancamento_id", "mes"],
    indices = [
        Index(value = ["id_usuario"])
    ]
)
data class LancamentoCartaoMesEntity(
    @ColumnInfo(name = "lancamento_id")
    val chargeId: Long,
    @ColumnInfo(name = "mes")
    val month: Int,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

