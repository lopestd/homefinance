import { useState } from "react";

const useDespesas = (initialDespesas = []) => {
  const [despesas, setDespesas] = useState(initialDespesas);

  return { despesas, setDespesas };
};

export default useDespesas;
