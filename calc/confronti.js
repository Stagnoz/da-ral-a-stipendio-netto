/**
 * Confronto secco tra la RAL inserita e una media. 
 * Ritorna null se la media non esiste, così la pagina non mostra 
 * niente invece di mostrare un confronto vuoto.
 */
export function confrontaConMedia(ral, media) {
  if (!media) return null;
  
  const scarto = ral - media.ral;
  
  return {
    media,
    scarto,
    scartoPercentuale: scarto / media.ral,
    sopra: scarto > 0,
  };
}
