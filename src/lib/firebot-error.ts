// Never display or log raw provider responses: they may echo buyer data or credentials.
export function firebotFailureMessage(status: number, response: unknown): string {
  const text = JSON.stringify(response ?? {}).toLowerCase();
  if (/credit_card/.test(text)) return "O cartão ainda não está ativado nesta conta. Peça a liberação ao suporte ou ative em Finanças > Adquirentes.";
  if (/pix n[ãa]o est[áa] habilitado/.test(text)) return "O Pix ainda não está ativado nesta conta. Peça a liberação ao suporte.";
  if (status === 401 || status === 403) return "O acesso ao pagamento foi recusado. Confira as credenciais e a habilitação do método na sua conta.";
  if (status === 429) return "O pagamento recebeu muitas solicitações. Aguarde um pouco antes de tentar novamente.";
  if (status === 400 || status === 422) {
    const hints = JSON.stringify(response ?? {}).toLowerCase();
    const fields: string[] = [];
    if (/email|e-mail/.test(hints)) fields.push("e-mail");
    if (/\bcpf\b|\bcnpj\b/.test(hints)) fields.push("CPF");
    if (/zipcode|zip_code|\bcep\b/.test(hints)) fields.push("CEP");
    if (/phone|telefone/.test(hints)) fields.push("WhatsApp");
    if (/storeurl|store_url/.test(hints)) fields.push("URL da loja");
    if (/shipping|address|endere/.test(hints) && !fields.includes("CEP")) fields.push("endereço de entrega");
    return fields.length ? `O pagamento recusou os dados de ${fields.join(", ")}. Confira antes de tentar novamente.` : "A solicitação de Pix foi recusada (400/422). Confira os dados do comprador, o endereço e a configuração da conta.";
  }
  return "Não foi possível concluir o pagamento. Uma nova tentativa não cancela automaticamente a cobrança anterior.";
}