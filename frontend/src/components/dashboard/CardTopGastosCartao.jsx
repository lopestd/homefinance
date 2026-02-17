import React from 'react';
import { formatCurrency } from '../../utils/appUtils';

/**
 * CardTopGastosCartao - Card que exibe os top 5 gastos por descrição de um cartão
 * @param {Object} cartao - Objeto do cartão
 * @param {Array} top5Gastos - Lista de top 5 gastos por descrição (obrigatório)
 * @param {number} totalGasto - Total gasto no mês (obrigatório)
 * @param {number} limite - Limite do cartão (obrigatório)
 * @param {number} saldo - Saldo disponível (obrigatório)
 */
const CardTopGastosCartao = ({
  cartao,
  top5Gastos = [],
  totalGasto = 0,
  limite = 0,
  saldo = 0
}) => {

  // Calcular largura da barra para cada gasto
  const maxValue = top5Gastos.length > 0 ? top5Gastos[0].value : 0;

  return (
    <div className="card-top-gastos-cartao">
      <div className="card-top-gastos-cartao__header">
        <span className="card-top-gastos-cartao__icon">💳</span>
        <h4 className="card-top-gastos-cartao__title">{cartao.nome}</h4>
      </div>

      <div className="card-top-gastos-cartao__summary">
        <div className="card-top-gastos-cartao__row">
          <span className="card-top-gastos-cartao__label">Total:</span>
          <span className="card-top-gastos-cartao__value">{formatCurrency(totalGasto)}</span>
        </div>
        <div className="card-top-gastos-cartao__row">
          <span className="card-top-gastos-cartao__label">Limite:</span>
          <span className="card-top-gastos-cartao__value">{formatCurrency(limite)}</span>
        </div>
        <div className="card-top-gastos-cartao__row">
          <span className="card-top-gastos-cartao__label">Disponível:</span>
          <span className={`card-top-gastos-cartao__value ${saldo >= 0 ? 'card-top-gastos-cartao__value--positive' : 'card-top-gastos-cartao__value--negative'}`}>
            {formatCurrency(saldo)}
          </span>
        </div>
      </div>

      {top5Gastos.length > 0 ? (
        <>
          <div className="card-top-gastos-cartao__gastos-title">
            Top 5 Gastos no Cartão
          </div>
          <div className="card-top-gastos-cartao__gastos-list">
            {top5Gastos.map((gasto, index) => (
              <div key={index} className="card-top-gastos-cartao__gasto-item">
                <span className="card-top-gastos-cartao__gasto-name" title={gasto.name}>
                  {gasto.name}
                </span>
                <div className="card-top-gastos-cartao__gasto-bar">
                  <div
                    className="card-top-gastos-cartao__gasto-bar-fill"
                    style={{ width: `${maxValue > 0 ? (gasto.value / maxValue) * 100 : 0}%` }}
                  />
                </div>
                <span className="card-top-gastos-cartao__gasto-value">
                  {formatCurrency(gasto.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card-top-gastos-cartao__empty">
          <p>Sem gastos no período</p>
        </div>
      )}
    </div>
  );
};

export default CardTopGastosCartao;
