package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "cartoes",
    indices = [
        Index(value = ["id_usuario", "nome"], unique = true)
    ]
)
data class CartaoEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "nome")
    val name: String,
    @ColumnInfo(name = "limite_centavos", defaultValue = "0")
    val defaultLimitCents: Long = 0L,
    @ColumnInfo(name = "ativo", defaultValue = "1")
    val isActive: Boolean = true,
    @ColumnInfo(name = "id_usuario")
    val userId: Long
)

