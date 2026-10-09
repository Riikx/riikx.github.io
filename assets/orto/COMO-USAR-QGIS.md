# Revisão dos traçados

1. Abra a imagem, clique em **Traçar linhas sobre a cana** e depois em **Editar pontos**. Selecione uma linha clicando perto de um ponto e arraste os pontos. **Desfazer** recupera a alteração anterior.
2. Para comparar, importe um **CSV com coluna WKT contendo LINESTRING**, nas mesmas coordenadas do JGW. GeoJSON RFC 7946 usa WGS84; só é aceito quando o orto também tiver WGS84 confirmado. SHP e GeoPackage precisam ser exportados pelo QGIS para um desses formatos.
3. O JSON de edição guarda pontos normalizados e as dimensões da imagem. Pode ser importado como referência para comparar versões com as mesmas dimensões.
4. **Exportar para QGIS** gera CSV WKT no sistema nativo do JGW enquanto o SRC não estiver confirmado. No QGIS, use **Adicionar camada de texto delimitado**, separador vírgula, geometria WKT, campo `wkt`. Escolha o SRC exato da exportação do orto; não escolha um EPSG por tentativa. O JGW não identifica o SRC.
5. Confirmando WGS84/EPSG:4326 no controle, a exportação passa a gerar GeoJSON.

As distâncias na interface são distâncias em pixels até o segmento de referência mais próximo, não desvios certificados em metros nem correspondências validadas entre fileiras. Vermelho indica pontos acima do limiar selecionado. Verifique carreadores, falhas de plantio, associações de linhas e georreferenciamento no QGIS antes de qualquer uso operacional.

O voo 3D usa o orto sobre um plano, com rota e altura simuladas. Não recria relevo nem produz um ortomosaico por fotogrametria.

Referência do formato GeoJSON: https://www.rfc-editor.org/rfc/rfc7946
