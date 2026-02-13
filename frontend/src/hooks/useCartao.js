import { useState } from "react";

const useCartao = (initialCartoes = [], initialLancamentos = []) => {
  const [cartoes, setCartoes] = useState(initialCartoes);
  const [lancamentosCartao, setLancamentosCartao] = useState(initialLancamentos);

  return { cartoes, setCartoes, lancamentosCartao, setLancamentosCartao };
};

export default useCartao;
