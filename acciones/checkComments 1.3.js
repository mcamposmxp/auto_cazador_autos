/**
 * Se activa automáticamente cada vez que se edita una celda.
 * Registra los cambios de contenido en la hoja 'changelog'.
 * @param {Object} e - El objeto de evento de edición.
 */
function onEdit(e) {
  // Define las constantes de las hojas y columnas a monitorear.
  const sheetNameToMonitor = 'Casos de uso';
  const changelogSheetName = 'changelog';
  const columnRangeToMonitor = [5, 10]; // Columnas E a J

  // Accede a la hoja activa y la hoja de registro.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = e.range.getSheet();

  // Verifica si la edición ocurrió en la hoja y rango correctos.
  if (activeSheet.getName() === sheetNameToMonitor &&
      e.range.getColumn() >= columnRangeToMonitor[0] &&
      e.range.getColumn() <= columnRangeToMonitor[1]) {
    
    // Si la celda editada no es un comentario, registra el cambio de contenido.
    const editedRow = e.range.getRow();
    const editedCol = e.range.getColumn();
    const sourceSheet = ss.getSheetByName(sheetNameToMonitor);
    const destinationSheet = ss.getSheetByName(changelogSheetName);

    // Si la hoja 'changelog' no existe, la crea.
    if (!destinationSheet) {
      ss.insertSheet(changelogSheetName);
    }
    
    // Obtenemos los datos de la fila.
    const dataToCopy = sourceSheet.getRange(editedRow, 1, 1, 11).getValues()[0];

    // Obtenemos metadatos.
    const header = sourceSheet.getRange(1, editedCol).getValue();
    const user = Session.getActiveUser().getEmail();
    const timestamp = Utilities.formatDate(new Date(), 'America/Mexico_City', 'dd/MM/yyyy HH:mm:ss');
    
    // Obtenemos los valores de la celda.
    const editedValue = e.value || '';
    const oldValue = e.oldValue || '';
    
    // Unimos los datos para el registro.
    // L: header, M: user, N: timestamp, O: oldValue, P: editedValue, Q: comment
    const newRecord = [...dataToCopy, header, user, timestamp, oldValue, editedValue, ""]; // El comentario lo manejaremos aparte

    // Agregamos la fila.
    destinationSheet.appendRow(newRecord);
  }
}


/**
 * Se ejecuta con un activador de tiempo para detectar cambios en los comentarios.
 * Registra los cambios en la hoja 'comments' y evita duplicados.
 */
function checkComments() {
  const sheetNameToMonitor = 'Casos de uso';
  const newCommentsSheetName = 'comments';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetNameToMonitor);

  if (!sheet) return;

  let commentsSheet = ss.getSheetByName(newCommentsSheetName);
  if (!commentsSheet) {
    commentsSheet = ss.insertSheet(newCommentsSheetName);
    commentsSheet.appendRow(['Fila', 'Columna', 'Usuario', 'Fecha', 'Comentario Anterior', 'Comentario Nuevo']);
    Logger.log('Hoja "comments" creada con los encabezados.');
  }

  const columnsToMonitor = [5, 6, 7, 8, 9, 10]; // Columnas E a J
  const allComments = {};

  const lastRow = sheet.getLastRow();
  Logger.log(`Recorriendo ${lastRow} filas en la hoja "${sheetNameToMonitor}".`);

  for (let i = 1; i <= lastRow; i++) {
    for (const colIndex of columnsToMonitor) {
      const cell = sheet.getRange(i, colIndex);
      const comment = cell.getComment();
      if (comment) {
        allComments[`${i}-${colIndex}`] = comment;
      }
    }
  }

  const scriptProperties = PropertiesService.getScriptProperties();
  const storedCommentsStr = scriptProperties.getProperty('comments');
  const storedComments = storedCommentsStr ? JSON.parse(storedCommentsStr) : {};

  const user = Session.getActiveUser().getEmail();
  const timestamp = Utilities.formatDate(new Date(), 'America/Mexico_City', 'dd/MM/yyyy HH:mm:ss');
  
  let changesFound = false;

  for (const key in allComments) {
    if (allComments[key] !== storedComments[key]) {
      const [row, col] = key.split('-').map(Number);
      const header = sheet.getRange(1, col).getValue() || getColumnName(col); // Usa el encabezado de la fila 1 o la letra de la columna
      const oldValue = storedComments[key] || '';
      const newValue = allComments[key];
      
      const newRecord = [row, header, user, timestamp, oldValue, newValue];
      Logger.log(`Intento de agregar/modificar registro: ` + JSON.stringify(newRecord));
      commentsSheet.appendRow(newRecord);
      changesFound = true;
    }
  }

  for (const key in storedComments) {
    if (!allComments[key]) {
      const [row, col] = key.split('-').map(Number);
      const header = sheet.getRange(1, col).getValue() || getColumnName(col); // Usa el encabezado de la fila 1 o la letra de la columna
      const oldValue = storedComments[key];
      const newValue = "Comentario eliminado";

      const newRecord = [row, header, user, timestamp, oldValue, newValue];
      Logger.log(`Intento de agregar registro de eliminación: ` + JSON.stringify(newRecord));
      commentsSheet.appendRow(newRecord);
      changesFound = true;
    }
  }

  scriptProperties.setProperty('comments', JSON.stringify(allComments));
  
  if (!changesFound) {
    Logger.log('No se encontraron nuevos cambios de comentarios para registrar.');
  }
}

/**
 * Función auxiliar para obtener el nombre de la columna a partir de su índice.
 * @param {number} colIndex El índice de la columna (ej. 1 para A, 2 para B).
 * @return {string} La letra de la columna.
 */
function getColumnName(colIndex) {
  let temp, letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}