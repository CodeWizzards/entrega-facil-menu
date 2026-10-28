// Never display or log raw provider responses: they may echo buyer data or credentials.
export function firebotFailureMessage(status: number, response: unknown): string {
  if (status === 401 || status === 403) return "A Firebot recusou o acesso ao pagamento. Confira a chave e a habilitação do método na sua conta.";
  if (status === 429) return "A Firebot recebeu muitas solicitações. Aguarde um pouco antes de tentar novamente.";
  if (status === 400 || status === 422) {
    const hints = JSON.stringify(response ?? {}).toLowerCase();
    const fields: string[] = [];
    if (/email|e-mail/.test(hints)) fields.push("e-mail");
    if (/\bcpf\b|\bcnpj\b/.test(hints)) fields.push("CPF");
    if (/zipcode|zip_code|\bcep\b/.test(hints)) fields.push("CEP");
    if (/phone|telefone/.test(hints)) fields.push("WhatsApp");
    if (/storeurl|store_url/.test(hints)) fields.push("URL da loja");
    if (/shipping|address|endere/.test(hints) && !fields.includes("CEP")) fields.push("endereço de entrega");
    return fields.length ? `A Firebot recusou os dados de ${fields.join(", ")}. Confira antes de tentar novamente.` : "A Firebot recusou a solicitação de Pix (400/422). Confira os dados do comprador, o endereço e a configuração da conta.";
  }
  return "A Firebot não concluiu a solicitação. Uma nova tentativa não cancela automaticamente a cobrança anterior.";
}