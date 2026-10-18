import { jsPDF } from 'jspdf';

/* ------------------------------------------------------------------
 * Generador del PDF "Formulario de atención y soporte técnico".
 * Dibuja el formulario en vectores (texto nítido y seleccionable),
 * en hoja carta, con dos copias separadas por una línea de corte:
 * la de respaldo y la del funcionario solicitante.
 * ------------------------------------------------------------------ */

/* ---------- Opciones compartidas con la pantalla ---------- */
export const TIPOS_EQUIPO = [
	['PC', 'PC'],
	['LAPTOP', 'Laptop'],
	['IMPRESORA', 'Impresora'],
	['OTRO', 'Otro'],
];

export const ESTADOS_FINALES = [
	['SOLUCIONADO', 'Solucionado'],
	['PARCIAL', 'Parcial'],
	['PENDIENTE', 'Pendiente'],
	['REQUIERE_REPUESTO', 'Requiere repuesto'],
	['SERVICIO_EXTERNO', 'Servicio externo'],
];

/* ---------- Medidas (mm) ---------- */
const PAGINA = { ancho: 215.9, alto: 279.4, margenX: 10, margenY: 7 }; // carta
const X0 = PAGINA.margenX;
const ANCHO = PAGINA.ancho - PAGINA.margenX * 2;
const ALTO_UTIL = PAGINA.alto - PAGINA.margenY * 2;

// En el formulario impreso la etiqueta ocupa la mitad y el texto la otra mitad.
// Baja este valor (ej. 0.35) si quieres más espacio para escribir.
const RATIO_ETIQUETA_ANCHA = 0.5;

const ALT = {
	logos: 16,
	cabecera: 12.5,
	titulo: 6.5,
	corta: 5.6,
	minAncha: 9.5,
	estado: 7,
	subtitulo: 5.6,
	firmas: 12,
	pie: 4.5,
};
const INTERLINEA = 3.6;

// Anchos de las filas de cuatro columnas: etiqueta | valor | etiqueta | valor
const COLUMNAS = [0.2, 0.3, 0.2, 0.3];
const TAMANO_TEXTO = 8.5;
const SEPARACION_COPIAS = 7;
const CASILLA = 2.6;

/* ---------- Utilidades ---------- */
const limpiar = (valor) => (valor == null ? '' : String(valor).trim());

const fechaLegible = (iso) => {
	const [anio, mes, dia] = limpiar(iso).split('-');
	return anio && mes && dia ? `${dia} / ${mes} / ${anio}` : '';
};

const fuente = (doc, estilo, tamano) => {
	doc.setFont('helvetica', estilo);
	doc.setFontSize(tamano);
};

const recortar = (doc, texto, anchoMax) => {
	if (doc.getTextWidth(texto) <= anchoMax) return texto;
	let corto = texto;
	while (corto.length > 1 && doc.getTextWidth(`${corto}...`) > anchoMax) {
		corto = corto.slice(0, -1);
	}
	return `${corto}...`;
};

const cargarImagen = (url) =>
	new Promise((resolve) => {
		if (!url) {
			resolve(null);
			return;
		}
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			canvas.getContext('2d').drawImage(img, 0, 0);
			resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
		};
		img.onerror = () => resolve(null);
		img.src = url;
	});

/* ---------- Piezas de dibujo ---------- */
const subrayado = (doc, x1, y, x2) => {
	doc.setLineWidth(0.2);
	doc.line(x1, y, x2, y);
	doc.setLineWidth(0.3);
};

const casilla = (doc, x, yCentro, marcada) => {
	const arriba = yCentro - CASILLA / 2;
	doc.setLineWidth(0.25);
	doc.rect(x, arriba, CASILLA, CASILLA);
	if (marcada) {
		doc.setLineWidth(0.45);
		doc.line(x + 0.5, arriba + 0.5, x + CASILLA - 0.5, arriba + CASILLA - 0.5);
		doc.line(x + CASILLA - 0.5, arriba + 0.5, x + 0.5, arriba + CASILLA - 0.5);
	}
	doc.setLineWidth(0.3);
};

const dibujarOpciones = (doc, opciones, seleccion, x, yCentro, anchoDisponible, extraOtro = '') => {
	// Si se marcó "Otro" con una descripción, la etiqueta pasa a ser "Otro: descripción".
	const especificacion = limpiar(extraOtro);
	const etiquetas = opciones.map(([valor, etiqueta]) =>
		valor === 'OTRO' && seleccion === 'OTRO' && especificacion ? `Otro: ${especificacion}` : etiqueta
	);

	const anchoTotal = (tamano) => {
		doc.setFontSize(tamano);
		return etiquetas.reduce(
			(suma, etiqueta, i) =>
				suma + CASILLA + 1.1 + doc.getTextWidth(etiqueta) + (i < etiquetas.length - 1 ? 2.2 : 0),
			0
		);
	};

	fuente(doc, 'normal', 7.5);
	let tamano = 7.5;
	while (tamano > 5.5 && anchoTotal(tamano) > anchoDisponible) tamano -= 0.25;
	fuente(doc, 'normal', tamano);

	let cx = x;
	opciones.forEach(([valor], i) => {
		casilla(doc, cx, yCentro, seleccion === valor);
		cx += CASILLA + 1.1;
		let texto = etiquetas[i];
		const libre = x + anchoDisponible - cx;
		if (doc.getTextWidth(texto) > libre) texto = recortar(doc, texto, libre);
		doc.text(texto, cx, yCentro, { baseline: 'middle' });
		cx += doc.getTextWidth(texto) + 2.2;
	});
};

const etiquetaCelda = (doc, texto, x, y, alto) => {
	fuente(doc, 'bold', 7.5);
	doc.text(texto, x + 1.6, y + alto / 2, { baseline: 'middle' });
};

const valorCelda = (doc, valor, x, y, ancho, alto) => {
	const texto = limpiar(valor);
	if (!texto) {
		subrayado(doc, x + 2, y + alto - 1.4, x + ancho - 2);
		return;
	}
	fuente(doc, 'normal', TAMANO_TEXTO);
	doc.text(recortar(doc, texto, ancho - 3.2), x + 1.6, y + alto / 2, { baseline: 'middle' });
};

const ajustarImagen = (img, cajaAncho, cajaAlto) => {
	const escala = Math.min(cajaAncho / img.w, cajaAlto / img.h);
	return { w: img.w * escala, h: img.h * escala };
};

const dibujarEncabezadoInstitucional = (doc, logos, y) => {
	const alto = ALT.logos;
	const cx = X0 + ANCHO / 2;

	if (logos.izquierda) {
		const { w, h } = ajustarImagen(logos.izquierda, 38, alto - 1);
		doc.addImage(logos.izquierda.dataUrl, 'PNG', X0 + 2, y + (alto - h) / 2, w, h);
	}
	if (logos.derecha) {
		const { w, h } = ajustarImagen(logos.derecha, 38, alto - 1);
		doc.addImage(logos.derecha.dataUrl, 'PNG', X0 + ANCHO - 2 - w, y + (alto - h) / 2, w, h);
	}
	if (logos.centro) {
		const { w, h } = ajustarImagen(logos.centro, 20, alto - 7.5);
		doc.addImage(logos.centro.dataUrl, 'PNG', cx - w / 2, y, w, h);
	}

	fuente(doc, 'normal', 7);
	doc.text('GOBIERNO AUTÓNOMO DEPARTAMENTAL DE COCHABAMBA', cx, y + alto - 5.4, { align: 'center' });
	fuente(doc, 'normal', 9);
	doc.text('GOBERNACIÓN', cx, y + alto - 1.8, { align: 'center' });
};

/* ---------- Medición (las filas de texto crecen si hace falta) ---------- */
const medirTexto = (doc, valor) => {
	fuente(doc, 'normal', TAMANO_TEXTO);
	const texto = limpiar(valor);
	const anchoTexto = ANCHO * (1 - RATIO_ETIQUETA_ANCHA) - 3.2;
	const lineas = doc.splitTextToSize(texto, anchoTexto);
	return {
		vacio: !texto,
		lineas,
		alto: Math.max(ALT.minAncha, lineas.length * INTERLINEA + 3.2),
	};
};

const medirCopia = (doc, datos) => {
	const problema = medirTexto(doc, datos.problema);
	const diagnostico = medirTexto(doc, datos.diagnostico);
	const trabajo = medirTexto(doc, datos.trabajo);
	const observaciones = medirTexto(doc, datos.observaciones);
	const total =
		ALT.logos + ALT.cabecera + ALT.titulo + ALT.corta * 3 +
		problema.alto + diagnostico.alto + trabajo.alto +
		ALT.estado + observaciones.alto +
		ALT.subtitulo + ALT.firmas + ALT.pie;
	return { problema, diagnostico, trabajo, observaciones, total };
};

/* ---------- Una copia completa del formulario ---------- */
const dibujarCopia = (doc, datos, y0, medidas, logos, pie) => {
	doc.setDrawColor(0);
	doc.setTextColor(0);
	doc.setLineWidth(0.3);

	let y = y0;
	const mitad = ANCHO * RATIO_ETIQUETA_ANCHA;
	const cols = COLUMNAS.map((r) => ANCHO * r);
	const xCol = [0, 1, 2, 3].map((i) => X0 + cols.slice(0, i).reduce((a, b) => a + b, 0));

	// Escudos y nombre de la institución
	dibujarEncabezadoInstitucional(doc, logos, y);
	y += ALT.logos;

	// Cuadro de cabecera: GADC | área | número de formulario
	const anchoGadc = ANCHO * 0.115;
	const anchoNumero = ANCHO * 0.2;
	const anchoCentro = ANCHO - anchoGadc - anchoNumero;
	doc.setLineWidth(0.4);
	doc.rect(X0, y, ANCHO, ALT.cabecera);
	doc.line(X0 + anchoGadc, y, X0 + anchoGadc, y + ALT.cabecera);
	doc.line(X0 + anchoGadc + anchoCentro, y, X0 + anchoGadc + anchoCentro, y + ALT.cabecera);
	doc.setLineWidth(0.3);

	fuente(doc, 'bold', 15);
	doc.text('GADC', X0 + anchoGadc / 2, y + ALT.cabecera / 2, { align: 'center', baseline: 'middle' });

	fuente(doc, 'bold', 8);
	const cxCentro = X0 + anchoGadc + anchoCentro / 2;
	doc.text('GOBIERNO AUTÓNOMO DEPARTAMENTAL', cxCentro, y + ALT.cabecera * 0.22, { align: 'center', baseline: 'middle' });
	doc.text('DE COCHABAMBA', cxCentro, y + ALT.cabecera * 0.5, { align: 'center', baseline: 'middle' });
	doc.text('ÁREA DE SOPORTE DE SISTEMAS INFORMÁTICOS', cxCentro, y + ALT.cabecera * 0.78, { align: 'center', baseline: 'middle' });

	const cxNumero = X0 + anchoGadc + anchoCentro + anchoNumero / 2;
	fuente(doc, 'bold', 8);
	doc.text('FORMULARIO N.º', cxNumero, y + ALT.cabecera * 0.3, { align: 'center', baseline: 'middle' });
	const numero = limpiar(datos.numeroFormulario);
	fuente(doc, 'bold', 9);
	doc.text(numero ? `STI-${numero}` : 'STI-________', cxNumero, y + ALT.cabecera * 0.7, { align: 'center', baseline: 'middle' });
	y += ALT.cabecera;

	// Título
	fuente(doc, 'bold', 11);
	doc.text('FORMULARIO DE ATENCIÓN Y SOPORTE TÉCNICO', X0 + ANCHO / 2, y + ALT.titulo / 2 + 0.3, { align: 'center', baseline: 'middle' });
	y += ALT.titulo;

	// Filas de cuatro columnas: etiqueta | valor | etiqueta | valor
	const filaCuatro = (yFila, etq1, val1, etq2, val2) => {
		for (let i = 0; i < 4; i += 1) doc.rect(xCol[i], yFila, cols[i], ALT.corta);
		etiquetaCelda(doc, etq1, xCol[0], yFila, ALT.corta);
		valorCelda(doc, val1, xCol[1], yFila, cols[1], ALT.corta);
		etiquetaCelda(doc, etq2, xCol[2], yFila, ALT.corta);
		valorCelda(doc, val2, xCol[3], yFila, cols[3], ALT.corta);
	};

	filaCuatro(y, 'FECHA', fechaLegible(datos.fecha), 'HORA', datos.hora);
	y += ALT.corta;
	filaCuatro(y, 'UNIDAD / DIRECCIÓN', datos.unidad, 'SOLICITANTE', datos.solicitante);
	y += ALT.corta;

	// Tipo de equipo (casillas) | N.º inventario
	for (let i = 0; i < 4; i += 1) doc.rect(xCol[i], y, cols[i], ALT.corta);
	etiquetaCelda(doc, 'TIPO DE EQUIPO', xCol[0], y, ALT.corta);
	dibujarOpciones(doc, TIPOS_EQUIPO, datos.tipoEquipo, xCol[1] + 1.6, y + ALT.corta / 2, cols[1] - 3.2, datos.tipoEquipoOtro);
	etiquetaCelda(doc, 'N.º INVENTARIO', xCol[2], y, ALT.corta);
	valorCelda(doc, datos.inventario, xCol[3], y, cols[3], ALT.corta);
	y += ALT.corta;

	// Filas anchas: etiqueta a la izquierda, texto a la derecha
	const filaAncha = (yFila, etiqueta, medida) => {
		doc.rect(X0, yFila, mitad, medida.alto);
		doc.rect(X0 + mitad, yFila, ANCHO - mitad, medida.alto);
		etiquetaCelda(doc, etiqueta, X0, yFila, medida.alto);
		if (medida.vacio) {
			subrayado(doc, X0 + mitad + 2, yFila + medida.alto * 0.42, X0 + ANCHO - 2);
			subrayado(doc, X0 + mitad + 2, yFila + medida.alto * 0.8, X0 + ANCHO - 2);
		} else {
			fuente(doc, 'normal', TAMANO_TEXTO);
			doc.text(medida.lineas, X0 + mitad + 1.6, yFila + 1.6, { baseline: 'top' });
		}
		return yFila + medida.alto;
	};

	y = filaAncha(y, 'PROBLEMA REPORTADO', medidas.problema);
	y = filaAncha(y, 'DIAGNÓSTICO', medidas.diagnostico);
	y = filaAncha(y, 'TRABAJO REALIZADO / SOLUCIÓN', medidas.trabajo);

	// Estado final
	doc.rect(X0, y, mitad, ALT.estado);
	doc.rect(X0 + mitad, y, ANCHO - mitad, ALT.estado);
	etiquetaCelda(doc, 'ESTADO FINAL', X0, y, ALT.estado);
	dibujarOpciones(doc, ESTADOS_FINALES, datos.estadoFinal, X0 + mitad + 1.6, y + ALT.estado / 2, ANCHO - mitad - 3.2);
	y += ALT.estado;

	y = filaAncha(y, 'OBSERVACIONES', medidas.observaciones);

	// Responsables
	doc.rect(X0, y, mitad, ALT.subtitulo);
	doc.rect(X0 + mitad, y, ANCHO - mitad, ALT.subtitulo);
	fuente(doc, 'bold', 8);
	doc.text('TÉCNICO RESPONSABLE', X0 + mitad / 2, y + ALT.subtitulo / 2, { align: 'center', baseline: 'middle' });
	doc.text('FUNCIONARIO SOLICITANTE', X0 + mitad + (ANCHO - mitad) / 2, y + ALT.subtitulo / 2, { align: 'center', baseline: 'middle' });
	y += ALT.subtitulo;

	const bloqueFirma = (x, ancho, nombre) => {
		doc.rect(x, y, ancho, ALT.firmas);
		fuente(doc, 'normal', 8);
		const anchoNombre = doc.getTextWidth('Nombre:');
		const anchoFirma = doc.getTextWidth('Firma:');
		doc.text('Nombre:', x + 1.6, y + 4.4, { baseline: 'middle' });
		doc.text('Firma:', x + 1.6, y + 9.4, { baseline: 'middle' });
		const inicioNombre = x + 1.6 + anchoNombre + 1.2;
		subrayado(doc, inicioNombre, y + 5.2, x + ancho - 3);
		subrayado(doc, x + 1.6 + anchoFirma + 1.2, y + 10.2, x + ancho - 3);
		const texto = limpiar(nombre);
		if (texto) {
			fuente(doc, 'normal', TAMANO_TEXTO);
			doc.text(recortar(doc, texto, x + ancho - 3 - inicioNombre), inicioNombre + 0.5, y + 4.5, { baseline: 'alphabetic' });
		}
	};
	bloqueFirma(X0, mitad, datos.tecnicoNombre);
	bloqueFirma(X0 + mitad, ANCHO - mitad, datos.funcionarioNombre);
	y += ALT.firmas;

	if (pie) {
		fuente(doc, 'italic', 7);
		doc.text(pie, X0 + ANCHO / 2, y + 3.2, { align: 'center' });
	}
};

const dibujarLineaCorte = (doc, y) => {
	doc.setLineWidth(0.2);
	doc.setLineDashPattern([1.2, 1.2], 0);
	doc.line(X0 + 6, y, X0 + ANCHO - 6, y);
	doc.setLineDashPattern([], 0);
	fuente(doc, 'normal', 8);
	doc.text('x', X0 + 1.5, y + 1, { baseline: 'middle' });
	doc.text('x', X0 + ANCHO - 3, y + 1, { baseline: 'middle' });
	doc.setLineWidth(0.3);
};

/* ---------- API pública ---------- */

/**
 * Construye el documento jsPDF.
 * @param {object} datos  Campos del formulario (ver ReporteTrabajo.jsx).
 * @param {object} opciones
 *   - logos: { izquierda, centro, derecha } URLs de imagen (opcionales)
 *   - copias: 1 o 2 (por defecto 2: respaldo + funcionario)
 */
export const construirDocumento = async (datos, { logos = {}, copias = 2 } = {}) => {
	const imagenes = {
		izquierda: await cargarImagen(logos.izquierda),
		centro: await cargarImagen(logos.centro),
		derecha: await cargarImagen(logos.derecha),
	};

	const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
	doc.setLineHeightFactor(1.25);
	doc.setProperties({
		title: `Formulario de atención y soporte técnico STI-${limpiar(datos.numeroFormulario)}`,
		subject: 'Gobierno Autónomo Departamental de Cochabamba - Soporte de Sistemas Informáticos',
	});

	const medidas = medirCopia(doc, datos);
	const yInicio = PAGINA.margenY;
	dibujarCopia(doc, datos, yInicio, medidas, imagenes, 'Registro de respaldo de atención técnica');

	if (copias === 2) {
		const entranDos = medidas.total * 2 + SEPARACION_COPIAS <= ALTO_UTIL;
		if (entranDos) {
			dibujarLineaCorte(doc, yInicio + medidas.total + SEPARACION_COPIAS / 2);
			dibujarCopia(doc, datos, yInicio + medidas.total + SEPARACION_COPIAS, medidas, imagenes, 'Copia para el funcionario solicitante');
		} else {
			// Si el texto es muy largo, la segunda copia va en otra hoja.
			doc.addPage();
			dibujarCopia(doc, datos, yInicio, medidas, imagenes, 'Copia para el funcionario solicitante');
		}
	}
	return doc;
};

export const generarReportePdf = async (datos, opciones) => {
	const doc = await construirDocumento(datos, opciones);
	const numero = limpiar(datos.numeroFormulario) || 'sin-numero';
	doc.save(`Formulario-STI-${numero}.pdf`);
};