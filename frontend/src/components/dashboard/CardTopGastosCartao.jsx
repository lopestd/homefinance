import { formatCurrency } from '../../utils/appUtils';

const MASKED_CURRENCY = 'R$ •••••';
const displayCurrency = (value, valuesVisible) => (
  valuesVisible ? formatCurrency(value) : MASKED_CURRENCY
);

const getCardBrand = (cartaoNome = '') => {
  const name = String(cartaoNome).toLowerCase();
  if (name.includes('visa')) return 'visa';
  if (name.includes('master')) return 'mastercard';
  return 'generic';
};

const CardBrandMark = ({ brand }) => {
  if (brand === 'visa') {
    return <span className="card-top-gastos-cartao__brand card-top-gastos-cartao__brand--visa">VISA</span>;
  }

  if (brand === 'mastercard') {
    return (
      <span className="card-top-gastos-cartao__brand card-top-gastos-cartao__brand--mastercard" aria-label="Mastercard">
        <span />
        <span />
      </span>
    );
  }

  return <span className="card-top-gastos-cartao__brand card-top-gastos-cartao__brand--generic">CARD</span>;
};

/**
 * CardTopGastosCartao - Card que exibe os top 5 gastos por descricao de um cartao.
 */
const CardTopGastosCartao = ({
  cartao,
  top5Gastos = [],
  totalGasto = 0,
  limite = 0,
  saldo = 0,
  valuesVisible = true
}) => {
  const maxValue = top5Gastos.length > 0 ? top5Gastos[0].value : 0;
  const brand = getCardBrand(cartao?.nome);

  return (
    <article className="card-top-gastos-cartao">
      <header className="card-top-gastos-cartao__header">
        <div className="card-top-gastos-cartao__identity">
          <CardBrandMark brand={brand} />
          <h4 className="card-top-gastos-cartao__title">{cartao.nome}</h4>
        </div>
        <button type="button" className="card-top-gastos-cartao__menu" aria-label={`Mais opções de ${cartao.nome}`}>
          ...
        </button>
      </header>

      <div className="card-top-gastos-cartao__summary" aria-label="Resumo do cartão">
        <div className="card-top-gastos-cartao__summary-item">
          <span>Total</span>
          <strong>{displayCurrency(totalGasto, valuesVisible)}</strong>
        </div>
        <div className="card-top-gastos-cartao__summary-item">
          <span>Limite</span>
          <strong>{displayCurrency(limite, valuesVisible)}</strong>
        </div>
        <div className="card-top-gastos-cartao__summary-item">
          <span>Disponível</span>
          <strong className={saldo >= 0 ? 'card-top-gastos-cartao__value--positive' : 'card-top-gastos-cartao__value--negative'}>
            {displayCurrency(saldo, valuesVisible)}
          </strong>
        </div>
      </div>

      {top5Gastos.length > 0 ? (
        <div className="card-top-gastos-cartao__gastos">
          <h5 className="card-top-gastos-cartao__gastos-title">Top 5 gastos no cartão</h5>
          <div className="card-top-gastos-cartao__gastos-list">
            {top5Gastos.map((gasto, index) => (
              <div key={`${gasto.name}-${index}`} className="card-top-gastos-cartao__gasto-item">
                <span className="card-top-gastos-cartao__gasto-name" title={gasto.name}>
                  {gasto.name}
                </span>
                <span className="card-top-gastos-cartao__gasto-bar" aria-hidden="true">
                  <span
                    className="card-top-gastos-cartao__gasto-bar-fill"
                    style={{ width: `${valuesVisible && maxValue > 0 ? (gasto.value / maxValue) * 100 : 54}%` }}
                  />
                </span>
                <strong className="card-top-gastos-cartao__gasto-value">
                  {displayCurrency(gasto.value, valuesVisible)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-top-gastos-cartao__empty">
          <p>Sem gastos no período</p>
        </div>
      )}
    </article>
  );
};

export default CardTopGastosCartao;
