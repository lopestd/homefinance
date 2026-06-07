package com.homefinance.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.homefinance.app.data.local.dao.CategoriaDao
import com.homefinance.app.data.local.dao.DespesaDao
import com.homefinance.app.data.local.dao.OrcamentoDao
import com.homefinance.app.data.local.dao.ReceitaDao
import com.homefinance.app.data.local.dao.SessionDao
import com.homefinance.app.data.local.dao.UserDao
import com.homefinance.app.data.local.entity.CategoriaEntity
import com.homefinance.app.data.local.entity.DespesaEntity
import com.homefinance.app.data.local.entity.OrcamentoEntity
import com.homefinance.app.data.local.entity.ReceitaEntity
import com.homefinance.app.data.local.entity.SessionEntity
import com.homefinance.app.data.local.entity.UserEntity

@Database(
    entities = [
        UserEntity::class,
        SessionEntity::class,
        OrcamentoEntity::class,
        CategoriaEntity::class,
        ReceitaEntity::class,
        DespesaEntity::class
    ],
    version = 2,
    exportSchema = true
)
abstract class HomeFinanceDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun sessionDao(): SessionDao
    abstract fun orcamentoDao(): OrcamentoDao
    abstract fun categoriaDao(): CategoriaDao
    abstract fun receitaDao(): ReceitaDao
    abstract fun despesaDao(): DespesaDao

    companion object {
        private const val DB_NAME = "homefinance_local.db"

        fun build(context: Context): HomeFinanceDatabase {
            return Room.databaseBuilder(
                context = context.applicationContext,
                klass = HomeFinanceDatabase::class.java,
                name = DB_NAME
            ).fallbackToDestructiveMigration().build()
        }
    }
}
