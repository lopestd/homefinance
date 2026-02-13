import { useState } from "react";

const useReceitas = (initialReceitas = []) => {
  const [receitas, setReceitas] = useState(initialReceitas);

  return { receitas, setReceitas };
};

export default useReceitas;
