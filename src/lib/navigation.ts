/** Redireciona o navegador (isolado para poder ser simulado nos testes). */
export const goTo = (url: string) => window.location.assign(url)
