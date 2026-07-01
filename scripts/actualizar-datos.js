const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = process.argv[2];
if (!EXCEL_PATH) {
  console.error('Uso: node actualizar-datos.js <ruta-al-excel.xlsx>');
  process.exit(1);
}

const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'trabajadores.js');

// --- Helper functions (misma lógica que usamos para generar) ---
function excelDateToStr(raw) {
  if (!raw && raw !== 0) return '';
  if (typeof raw === 'number') {
    const d = new Date((raw - 25569) * 86400 * 1000);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }
  let s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return s;
}

function parseBool(v) {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  if (s === 'n/a' || s === 'pendiente') return false;
  return s === 'entregado' || s === 'sí' || s === 'si' || s === 'true' || s === '✔' || s === '✓' || s === 'x' || s === '*';
}

function clean(v) {
  if (!v && v !== 0) return '';
  return String(v).trim().replace(/\s+/g, ' ');
}

function noFalsy(v) {
  const s = clean(v);
  if (!s) return '';
  const lc = s.toLowerCase();
  if (lc === 'n/a' || lc === 'n/s' || lc === 'na' || lc === 'ns') return '';
  if (lc === 'no lo ha tramitado' || lc === 'no lo a tramitado') return '';
  if (lc.startsWith('no registrad')) return '';
  if (lc === 'pendiente') return '';
  if (lc === 'xxxx') return '';
  return s;
}

function nr(v) { const s = noFalsy(v); return s || 'No registrado'; }
function nrObs(v) { const s = noFalsy(v); return s || 'No registradas'; }

function splitLocalidad(raw) {
  const s = clean(raw);
  if (!s) return { localidad: '', municipio: '', estado: '' };
  let str = s.replace(/\.+$/, '').trim();
  const parts = str.split(',').map(p => p.trim());
  return {
    localidad: parts[0] || '',
    municipio: '',
    estado: parts.length > 1 ? parts.slice(1).join(', ').trim() : ''
  };
}

function empresaShort(full) {
  const s = clean(full).toLowerCase();
  if (s.includes('vivienda') || s.includes('vdt')) return 'VDT';
  if (s.includes('chefu') || s.includes('chifu')) return 'Chifu';
  return clean(full);
}

function normalizeName(n) {
  return clean(n).toLowerCase().replace(/[^a-z0-9áéíóúüñ\s]/g, '').replace(/\s+/g, ' ');
}

// --- Leer el Excel ---
const workbook = XLSX.readFile(EXCEL_PATH);

const personalArr = XLSX.utils.sheet_to_json(workbook.Sheets['Info. Personal'], { header: 1 });
const fiscalArr = XLSX.utils.sheet_to_json(workbook.Sheets['Info. Fiscal'], { header: 1 });
const docsArr = XLSX.utils.sheet_to_json(workbook.Sheets['Documentos'], { header: 1 });
const uniformesArr = XLSX.utils.sheet_to_json(workbook.Sheets['Uniformes'], { header: 1 });

function findDataStart(arr) {
  for (let i = 0; i < Math.min(arr.length, 15); i++) {
    const row = arr[i];
    if (!row || row.length === 0) continue;
    const first = row[0];
    if (first !== undefined && first !== null && first !== '' && !isNaN(Number(first)) && Number(first) >= 1 && Number(first) <= 99) return i;
  }
  return -1;
}

function buildNameMap(arr, start, nameCol) {
  const map = {};
  for (let i = start; i < arr.length; i++) {
    const row = arr[i];
    if (!row || row.length === 0) continue;
    const name = clean(row[nameCol]);
    if (name) map[normalizeName(name)] = row;
  }
  return map;
}

const pStart = findDataStart(personalArr);
const fStart = findDataStart(fiscalArr);
const dStart = findDataStart(docsArr);
const uStart = findDataStart(uniformesArr);

const docsByName = buildNameMap(docsArr, dStart, 1);
const uniformesByName = buildNameMap(uniformesArr, uStart, 1);
const fiscalByName = buildNameMap(fiscalArr, fStart, 1);

// --- Construir mapa de datos nuevos desde el Excel ---
const excelByName = {};

for (let i = pStart; i < personalArr.length; i++) {
  const p = personalArr[i];
  if (!p || p.length === 0) continue;
  const no = clean(p[0]);
  if (!no || isNaN(Number(no))) continue;

  const normName = normalizeName(p[1]);
  const f = fiscalByName[normName] || null;
  const d = docsByName[normName] || null;
  const u = uniformesByName[normName] || null;

  const localidadParsed = splitLocalidad(clean(p[5] || ''));

  excelByName[normName] = {
    nombre: clean(p[1]),
    fechaNacimiento: excelDateToStr(p[2]),
    direccion: clean(p[3] || ''),
    cp: clean(p[4] || ''),
    localidad: localidadParsed.localidad,
    municipio: localidadParsed.municipio,
    estado: localidadParsed.estado,
    telefonoPersonal: clean(p[6] || ''),
    correoPersonal: clean(p[7] || ''),
    contactoEmergencia: clean(p[8] || ''),
    padecimiento: noFalsy(p[9]),
    parentesco: clean(p[10] || ''),
    telefonoEmergencia: clean(p[11] || ''),
    observaciones: noFalsy(p[12]),
    fechaIngreso: f ? excelDateToStr(f[2]) : '',
    correoEmpresarial: f ? noFalsy(f[4]) : '',
    puesto: f ? clean(f[5] || '') : '',
    area: f ? clean(f[6] || '') : '',
    curp: f ? noFalsy(f[7]) : '',
    rfc: f ? noFalsy(f[8]) : '',
    nss: f ? noFalsy(f[9]) : '',
    empresaRaw: f ? clean(f[10] || '') : '',
    docs: d ? {
      solicitud: parseBool(d[2]),
      ine: parseBool(d[3]),
      domicilio: parseBool(d[4]),
      curp: parseBool(d[5]),
      rfc: parseBool(d[6]),
      estudios: parseBool(d[7]),
      curriculum: parseBool(d[8]),
      nss: parseBool(d[9]),
      licencia: parseBool(d[10])
    } : null,
    camisa1: u ? clean(u[3] || '') : '',
    camisa2: u ? clean(u[4] || '') : '',
    camisa3: u ? clean(u[5] || '') : '',
    camisa4: u ? clean(u[6] || '') : '',
    talla: u ? clean(u[7] || '') : '',
  };
}

// --- Leer trabajadores.js actual ---
const dataContent = fs.readFileSync(DATA_FILE, 'utf8');

// Extraer el array de trabajadores como texto
const match = dataContent.match(/export const trabajadores\s*=\s*(\[[\s\S]*\]);/);
if (!match) {
  console.error('No se pudo parsear trabajadores.js');
  process.exit(1);
}

const trabajadores = eval(match[1]);

// --- Fusionar datos ---
let actualizados = 0;
let noEncontrados = [];

for (const [normName, excelData] of Object.entries(excelByName)) {
  const worker = trabajadores.find(w => normalizeName(w.nombre) === normName);
  if (!worker) {
    noEncontrados.push(excelData.nombre);
    continue;
  }

  const dc = worker.datos_completos;
  const empresa = empresaShort(excelData.empresaRaw);

  // Solo actualizar si el Excel trae valor no vacío
  if (excelData.fechaNacimiento) dc['Fecha de nacimiento'] = excelData.fechaNacimiento;
  if (excelData.curp) dc['CURP'] = excelData.curp;
  if (excelData.rfc) dc['RFC'] = excelData.rfc;
  if (excelData.nss) dc['NSS'] = excelData.nss;
  if (excelData.direccion) dc['Dirección'] = excelData.direccion;
  if (excelData.cp) dc['Código postal'] = excelData.cp;
  if (excelData.localidad) dc['Localidad'] = excelData.localidad;
  if (excelData.municipio) dc['Municipio'] = excelData.municipio;
  if (excelData.estado) dc['Estado'] = excelData.estado;
  if (excelData.telefonoPersonal) dc['Teléfono personal'] = nr(excelData.telefonoPersonal);
  if (excelData.correoPersonal) dc['Correo personal'] = nr(excelData.correoPersonal);
  if (excelData.correoEmpresarial) dc['Correo empresarial'] = nr(excelData.correoEmpresarial);
  if (excelData.contactoEmergencia) dc['Nombre del contacto'] = nr(excelData.contactoEmergencia);
  if (excelData.parentesco) dc['Parentesco'] = nr(excelData.parentesco);
  if (excelData.telefonoEmergencia) dc['Teléfono de emergencia'] = nr(excelData.telefonoEmergencia);
  if (excelData.padecimiento) dc['Padecimiento médico'] = nr(excelData.padecimiento);
  if (excelData.observaciones) dc['Observaciones'] = nrObs(excelData.observaciones);
  if (excelData.camisa1) dc['Camisa 1'] = excelData.camisa1;
  if (excelData.camisa2) dc['Camisa 2'] = excelData.camisa2;
  if (excelData.camisa3) dc['Camisa 3'] = excelData.camisa3;
  if (excelData.camisa4) dc['Camisa 4'] = excelData.camisa4;
  if (excelData.talla) dc['Talla'] = excelData.talla;
  if (empresa) dc['Empresa'] = empresa;
  if (excelData.puesto) dc['Puesto'] = excelData.puesto;
  if (excelData.area) dc['Área'] = excelData.area;
  if (excelData.fechaIngreso) dc['Fecha de ingreso'] = excelData.fechaIngreso;

  // Top-level fields
  if (empresa) worker.empresa = empresa;
  if (excelData.puesto) worker.puesto = excelData.puesto;
  if (excelData.area) worker.area = excelData.area;
  if (excelData.telefonoPersonal) worker.telefono = excelData.telefonoPersonal;
  if (excelData.correoPersonal) worker.correo = excelData.correoPersonal;
  if (excelData.fechaIngreso) worker.fechaIngreso = excelData.fechaIngreso;

  // Documentos (solo si el Excel tiene al menos un true)
  if (excelData.docs) {
    const hasAny = Object.values(excelData.docs).some(v => v === true);
    if (hasAny) {
      for (const [key, val] of Object.entries(excelData.docs)) {
        if (val) worker.documentos[key] = true;
      }
    }
  }

  actualizados++;
}

// --- Escribir archivo actualizado ---
// Generar el mismo formato que el archivo original
let output = 'export const trabajadores = [\n';
for (const w of trabajadores) {
  output += `  ${JSON.stringify(w, null, 2).replace(/^/gm, '  ').trimStart()},\n`;
}
output += '];\n';
// Conservar el comentario del footer si existe
const footerMatch = dataContent.match(/\n(\/\/.*)$/);
if (footerMatch) output += '\n' + footerMatch[1] + '\n';

fs.writeFileSync(DATA_FILE, output, 'utf8');

// --- Reporte ---
console.log('=== Actualización completada ===');
console.log(`Trabajadores actualizados: ${actualizados}`);
if (noEncontrados.length) {
  console.log(`No encontrados en el sistema (${noEncontrados.length}):`);
  for (const n of noEncontrados) console.log(`  - ${n}`);
}
console.log(`Archivo: ${DATA_FILE}`);
