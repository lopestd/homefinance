const { pool } = require('./backend/src/storage/db');
const configRepository = require('./backend/src/repositories/configRepository');
const configService = require('./backend/src/services/configService');

async function testCartaoUpdate() {
  const userId = 'test_user_' + Date.now();
  
  console.log('--- Iniciando Teste de Update de Cartão ---');

  // 1. Criar usuário (mock ou real se necessário, mas aqui vamos simular inserção direta de dados)
  // Como as tabelas tem id_usuario varchar, podemos usar string direta.
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // 2. Criar Cartão Inicial
    console.log('Criando cartão inicial...');
    const cartaoRes = await client.query(
      "INSERT INTO admhomefinance.cartoes (nome, limite, ativo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id",
      ['Cartão Teste', 1000, true, userId]
    );
    const cartaoId = cartaoRes.rows[0].id;
    console.log('Cartão criado ID:', cartaoId);

    // 3. Criar Lançamentos vinculados
    console.log('Criando lançamentos vinculados...');
    await client.query(
      "INSERT INTO admhomefinance.lancamentos_cartao (cartao_id, categoria_id, descricao, valor, mes_referencia, id_usuario) VALUES ($1, $2, $3, $4, $5, $6)",
      [cartaoId, null, 'Compra Teste 1', 100, 1, userId]
    );
    
    // Verificar lançamentos antes
    const lancamentosAntes = await client.query("SELECT * FROM admhomefinance.lancamentos_cartao WHERE cartao_id = $1", [cartaoId]);
    console.log('Lançamentos antes do update:', lancamentosAntes.rowCount);
    if (lancamentosAntes.rowCount === 0) throw new Error('Falha ao criar lançamentos de teste');

    await client.query("COMMIT"); // Commit setup
    
    // 4. Executar Update via Service (simulando o payload do frontend)
    console.log('Executando saveConfig com update do cartão...');
    const payload = {
      _partial: true,
      cartoes: [{
        id: cartaoId,
        nome: 'Cartão Teste Editado', // Mudança de nome
        limite: 2000, // Mudança de limite
        ativo: true,
        limitesMensais: { 'Janeiro': 2000 },
        faturasFechadas: []
      }]
      // Nota: NÃO estamos enviando lancamentosCartao no payload, o que é comum em updates parciais de cartão
    };

    await configService.saveConfig(payload, userId);

    // 5. Verificar se lançamentos ainda existem
    const lancamentosDepois = await pool.query("SELECT * FROM admhomefinance.lancamentos_cartao WHERE cartao_id = $1", [cartaoId]);
    console.log('Lançamentos depois do update:', lancamentosDepois.rowCount);

    if (lancamentosDepois.rowCount === lancamentosAntes.rowCount) {
      console.log('SUCESSO: Lançamentos preservados!');
    } else {
      console.error('FALHA: Lançamentos foram apagados!');
      console.error(`Antes: ${lancamentosAntes.rowCount}, Depois: ${lancamentosDepois.rowCount}`);
    }
    
    // Limpeza
    await pool.query("DELETE FROM admhomefinance.cartoes WHERE id_usuario = $1", [userId]);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Erro no teste:', error);
  } finally {
    client.release();
    pool.end();
  }
}

testCartaoUpdate();