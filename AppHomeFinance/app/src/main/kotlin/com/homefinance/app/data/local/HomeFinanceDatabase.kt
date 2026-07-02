package com.homefinance.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.homefinance.app.data.local.dao.CategoriaDao
import com.homefinance.app.data.local.dao.CartaoDao
import com.homefinance.app.data.local.dao.DespesaDao
import com.homefinance.app.data.local.dao.OrcamentoDao
import com.homefinance.app.data.local.dao.PredefinedDao
import com.homefinance.app.data.local.dao.ReceitaDao
import com.homefinance.app.data.local.dao.SessionDao
import com.homefinance.app.data.local.dao.UserDao
import com.homefinance.app.data.local.entity.AuditLogEntity
import com.homefinance.app.data.local.entity.CategoriaEntity
import com.homefinance.app.data.local.entity.CartaoEntity
import com.homefinance.app.data.local.entity.CartaoFaturaFechadaEntity
import com.homefinance.app.data.local.entity.CartaoLancamentoLegacyEntity
import com.homefinance.app.data.local.entity.CartaoLimiteMensalEntity
import com.homefinance.app.data.local.entity.CartaoMesEntity
import com.homefinance.app.data.local.entity.DespesaEntity
import com.homefinance.app.data.local.entity.DespesaMesEntity
import com.homefinance.app.data.local.entity.GastoPredefinidoEntity
import com.homefinance.app.data.local.entity.LancamentoCartaoEntity
import com.homefinance.app.data.local.entity.LancamentoCartaoMesEntity
import com.homefinance.app.data.local.entity.OrcamentoEntity
import com.homefinance.app.data.local.entity.OrcamentoMesEntity
import com.homefinance.app.data.local.entity.ReceitaEntity
import com.homefinance.app.data.local.entity.ReceitaMesEntity
import com.homefinance.app.data.local.entity.SaldoInicialOrcamentoEntity
import com.homefinance.app.data.local.entity.SessionEntity
import com.homefinance.app.data.local.entity.TipoReceitaEntity
import com.homefinance.app.data.local.entity.UserEntity

@Database(
    entities = [
        UserEntity::class,
        SessionEntity::class,
        OrcamentoEntity::class,
        CategoriaEntity::class,
        ReceitaEntity::class,
        DespesaEntity::class,
        OrcamentoMesEntity::class,
        ReceitaMesEntity::class,
        DespesaMesEntity::class,
        GastoPredefinidoEntity::class,
        TipoReceitaEntity::class,
        SaldoInicialOrcamentoEntity::class,
        CartaoEntity::class,
        CartaoLimiteMensalEntity::class,
        CartaoFaturaFechadaEntity::class,
        LancamentoCartaoEntity::class,
        LancamentoCartaoMesEntity::class,
        AuditLogEntity::class,
        CartaoMesEntity::class,
        CartaoLancamentoLegacyEntity::class
    ],
    version = 3,
    exportSchema = true
)
abstract class HomeFinanceDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun sessionDao(): SessionDao
    abstract fun orcamentoDao(): OrcamentoDao
    abstract fun categoriaDao(): CategoriaDao
    abstract fun receitaDao(): ReceitaDao
    abstract fun despesaDao(): DespesaDao
    abstract fun predefinedDao(): PredefinedDao
    abstract fun cartaoDao(): CartaoDao

    companion object {
        private const val DB_NAME = "homefinance_local.db"

        fun build(context: Context): HomeFinanceDatabase {
            return Room.databaseBuilder(
                context = context.applicationContext,
                klass = HomeFinanceDatabase::class.java,
                name = DB_NAME
            )
                .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                .build()
        }

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `orcamentos` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `id_usuario` INTEGER NOT NULL,
                        `ano` INTEGER NOT NULL,
                        `ativo` INTEGER NOT NULL,
                        `criado_em` TEXT NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_orcamentos_id_usuario_ano` ON `orcamentos` (`id_usuario`, `ano`)")
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `categorias` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `id_usuario` INTEGER NOT NULL,
                        `nome` TEXT NOT NULL,
                        `tipo` TEXT NOT NULL,
                        `ativa` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_categorias_id_usuario_tipo_nome` ON `categorias` (`id_usuario`, `tipo`, `nome`)")
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `receitas` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `id_usuario` INTEGER NOT NULL,
                        `orcamento_id` INTEGER NOT NULL,
                        `categoria_id` INTEGER,
                        `descricao` TEXT NOT NULL,
                        `valor_centavos` INTEGER NOT NULL,
                        `status` TEXT NOT NULL,
                        `criado_em` TEXT NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_receitas_id_usuario_orcamento_id` ON `receitas` (`id_usuario`, `orcamento_id`)")
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `despesas` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `id_usuario` INTEGER NOT NULL,
                        `orcamento_id` INTEGER NOT NULL,
                        `categoria_id` INTEGER,
                        `descricao` TEXT NOT NULL,
                        `valor_centavos` INTEGER NOT NULL,
                        `status` TEXT NOT NULL,
                        `criado_em` TEXT NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_despesas_id_usuario_orcamento_id` ON `despesas` (`id_usuario`, `orcamento_id`)")
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE `receitas` ADD COLUMN `complemento` TEXT")
                db.execSQL("ALTER TABLE `receitas` ADD COLUMN `mes_referencia` INTEGER NOT NULL DEFAULT 1")
                db.execSQL("ALTER TABLE `receitas` ADD COLUMN `data` TEXT")
                db.execSQL("ALTER TABLE `receitas` ADD COLUMN `tipo_recorrencia` TEXT NOT NULL DEFAULT 'EVENTUAL'")
                db.execSQL("ALTER TABLE `receitas` ADD COLUMN `parcela_atual` INTEGER")
                db.execSQL("ALTER TABLE `receitas` ADD COLUMN `total_parcelas` INTEGER")

                db.execSQL("ALTER TABLE `despesas` ADD COLUMN `complemento` TEXT")
                db.execSQL("ALTER TABLE `despesas` ADD COLUMN `mes_referencia` INTEGER NOT NULL DEFAULT 1")
                db.execSQL("ALTER TABLE `despesas` ADD COLUMN `data` TEXT")
                db.execSQL("ALTER TABLE `despesas` ADD COLUMN `tipo_recorrencia` TEXT NOT NULL DEFAULT 'EVENTUAL'")
                db.execSQL("ALTER TABLE `despesas` ADD COLUMN `parcela_atual` INTEGER")
                db.execSQL("ALTER TABLE `despesas` ADD COLUMN `total_parcelas` INTEGER")
                db.execSQL("ALTER TABLE `despesas` ADD COLUMN `fatura_cartao_id` INTEGER")
                db.execSQL("ALTER TABLE `despesas` ADD COLUMN `fatura_orcamento_id` INTEGER")
                db.execSQL("ALTER TABLE `despesas` ADD COLUMN `fatura_mes` INTEGER")

                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `orcamento_meses` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `orcamento_id` INTEGER NOT NULL,
                        `mes` INTEGER NOT NULL,
                        `id_usuario` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_orcamento_meses_orcamento_id_mes` ON `orcamento_meses` (`orcamento_id`, `mes`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_orcamento_meses_id_usuario` ON `orcamento_meses` (`id_usuario`)")

                db.execSQL(
                    """
                    INSERT OR IGNORE INTO `orcamento_meses` (`orcamento_id`, `mes`, `id_usuario`)
                    SELECT o.`id`, m.`mes`, o.`id_usuario`
                    FROM `orcamentos` o
                    JOIN (
                        SELECT 1 AS mes UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
                        UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
                    ) m
                    """.trimIndent()
                )

                db.execSQL("CREATE TABLE IF NOT EXISTS `receitas_meses` (`receita_id` INTEGER NOT NULL, `mes` INTEGER NOT NULL, `id_usuario` INTEGER NOT NULL, PRIMARY KEY(`receita_id`, `mes`))")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_receitas_meses_id_usuario` ON `receitas_meses` (`id_usuario`)")
                db.execSQL("CREATE TABLE IF NOT EXISTS `despesas_meses` (`despesa_id` INTEGER NOT NULL, `mes` INTEGER NOT NULL, `id_usuario` INTEGER NOT NULL, PRIMARY KEY(`despesa_id`, `mes`))")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_despesas_meses_id_usuario` ON `despesas_meses` (`id_usuario`)")

                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `gastos_predefinidos` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `categoria_id` INTEGER NOT NULL,
                        `descricao` TEXT NOT NULL,
                        `ativo` INTEGER NOT NULL DEFAULT 1,
                        `id_usuario` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_gastos_predefinidos_id_usuario_categoria_id_descricao` ON `gastos_predefinidos` (`id_usuario`, `categoria_id`, `descricao`)")

                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `tipos_receita` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `descricao` TEXT NOT NULL,
                        `recorrente` INTEGER NOT NULL DEFAULT 0,
                        `ativo` INTEGER NOT NULL DEFAULT 1,
                        `id_usuario` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_tipos_receita_id_usuario_descricao` ON `tipos_receita` (`id_usuario`, `descricao`)")

                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `saldo_inicial_orcamento` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `id_usuario` INTEGER NOT NULL,
                        `orcamento_id` INTEGER NOT NULL,
                        `ano` INTEGER NOT NULL,
                        `saldo_inicial_centavos` INTEGER NOT NULL DEFAULT 0,
                        `criado_em` TEXT NOT NULL,
                        `atualizado_em` TEXT
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_saldo_inicial_orcamento_id_usuario_orcamento_id_ano` ON `saldo_inicial_orcamento` (`id_usuario`, `orcamento_id`, `ano`)")

                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `cartoes` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `nome` TEXT NOT NULL,
                        `limite_centavos` INTEGER NOT NULL DEFAULT 0,
                        `ativo` INTEGER NOT NULL DEFAULT 1,
                        `id_usuario` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_cartoes_id_usuario_nome` ON `cartoes` (`id_usuario`, `nome`)")

                db.execSQL("CREATE TABLE IF NOT EXISTS `cartao_limites_mensais` (`cartao_id` INTEGER NOT NULL, `orcamento_id` INTEGER NOT NULL, `mes` INTEGER NOT NULL, `limite_centavos` INTEGER NOT NULL, `id_usuario` INTEGER NOT NULL, PRIMARY KEY(`cartao_id`, `orcamento_id`, `mes`))")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_cartao_limites_mensais_id_usuario` ON `cartao_limites_mensais` (`id_usuario`)")
                db.execSQL("CREATE TABLE IF NOT EXISTS `cartao_faturas_fechadas` (`cartao_id` INTEGER NOT NULL, `orcamento_id` INTEGER NOT NULL, `mes` INTEGER NOT NULL, `id_usuario` INTEGER NOT NULL, PRIMARY KEY(`cartao_id`, `orcamento_id`, `mes`))")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_cartao_faturas_fechadas_id_usuario` ON `cartao_faturas_fechadas` (`id_usuario`)")

                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `lancamentos_cartao` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `orcamento_id` INTEGER NOT NULL,
                        `cartao_id` INTEGER NOT NULL,
                        `categoria_id` INTEGER,
                        `descricao` TEXT NOT NULL,
                        `complemento` TEXT,
                        `valor_centavos` INTEGER NOT NULL,
                        `data` TEXT NOT NULL,
                        `mes_referencia` INTEGER NOT NULL,
                        `tipo_recorrencia` TEXT NOT NULL,
                        `parcela_atual` INTEGER,
                        `total_parcelas` INTEGER,
                        `id_usuario` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_lancamentos_cartao_id_usuario_orcamento_id_mes_referencia_cartao_id` ON `lancamentos_cartao` (`id_usuario`, `orcamento_id`, `mes_referencia`, `cartao_id`)")
                db.execSQL("CREATE TABLE IF NOT EXISTS `lancamentos_cartao_meses` (`lancamento_id` INTEGER NOT NULL, `mes` INTEGER NOT NULL, `id_usuario` INTEGER NOT NULL, PRIMARY KEY(`lancamento_id`, `mes`))")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_lancamentos_cartao_meses_id_usuario` ON `lancamentos_cartao_meses` (`id_usuario`)")

                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `audit_log` (
                        `id_log` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `id_usuario` INTEGER,
                        `acao` TEXT NOT NULL,
                        `detalhes` TEXT,
                        `ip_origem` TEXT,
                        `user_agent` TEXT,
                        `data_evento` TEXT NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_audit_log_id_usuario` ON `audit_log` (`id_usuario`)")

                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `cartao_meses` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `cartao_id` INTEGER NOT NULL,
                        `orcamento_mes_id` INTEGER NOT NULL,
                        `id_usuario` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_cartao_meses_cartao_id_orcamento_mes_id` ON `cartao_meses` (`cartao_id`, `orcamento_mes_id`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_cartao_meses_id_usuario` ON `cartao_meses` (`id_usuario`)")

                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `cartao_lancamentos` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `cartao_mes_id` INTEGER NOT NULL,
                        `descricao` TEXT NOT NULL,
                        `valor_centavos` INTEGER NOT NULL,
                        `tipo_recorrencia` TEXT NOT NULL,
                        `paga` INTEGER NOT NULL DEFAULT 0,
                        `id_usuario` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_cartao_lancamentos_cartao_mes_id` ON `cartao_lancamentos` (`cartao_mes_id`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_cartao_lancamentos_id_usuario` ON `cartao_lancamentos` (`id_usuario`)")
            }
        }
    }
}
