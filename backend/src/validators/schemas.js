const Joi = require("joi");

// Schema para ID de parâmetro de rota
const idParamSchema = Joi.object({
  id: Joi.string().pattern(/^\d+$/).required()
});

// Schema para categoria
const categoriaSchema = Joi.object({
  nome: Joi.string().trim().min(1).max(100).required(),
  tipo: Joi.string().valid("DESPESA", "RECEITA", "despesa", "receita").required()
});

// Schema para gasto pré-definido
const gastoPredefinidoSchema = Joi.object({
  descricao: Joi.string().trim().min(1).max(200).required(),
  categoriaId: Joi.number().integer().positive().required()
});

// Schema para tipo de receita
const tipoReceitaSchema = Joi.object({
  descricao: Joi.string().trim().min(1).max(200).required(),
  recorrente: Joi.boolean().optional()
});

// Schema para configuração do usuário
const configSchema = Joi.object({
  moeda: Joi.string().max(10).optional(),
  idioma: Joi.string().max(10).optional(),
  tema: Joi.string().valid("light", "dark", "auto").optional()
}).unknown(true);

// Função auxiliar para validar dados
const validate = (schema, data, options = {}) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    ...options
  });
  
  if (error) {
    const messages = error.details.map(detail => detail.message).join("; ");
    return { valid: false, error: messages };
  }
  
  return { valid: true, value };
};

module.exports = {
  idParamSchema,
  categoriaSchema,
  gastoPredefinidoSchema,
  tipoReceitaSchema,
  configSchema,
  validate
};
